package collzap.backend.service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import collzap.backend.dto.UserDtos.PeerProfileResponse;
import collzap.backend.dto.UserDtos.PeerProfileResponse.PeerInterest;
import collzap.backend.dto.UserDtos.RegisterDeviceRequest;
import collzap.backend.dto.UserDtos.SettingsResponse;
import collzap.backend.dto.UserDtos.UpdatePhotoRequest;
import collzap.backend.dto.UserDtos.UpdateProfileRequest;
import collzap.backend.dto.UserDtos.UpdateSettingsRequest;
import collzap.backend.dto.UserDtos.UserResponse;
import collzap.backend.enums.SeriousnessLevel;
import collzap.backend.enums.Status;
import collzap.backend.enums.VerificationStatus;
import collzap.backend.exception.ConflictException;
import collzap.backend.exception.ForbiddenException;
import collzap.backend.exception.NotFoundException;
import collzap.backend.exception.UnauthorizedException;
import collzap.backend.models.ChatMessage;
import collzap.backend.models.College;
import collzap.backend.models.DeviceToken;
import collzap.backend.models.User;
import collzap.backend.repositories.BlockReportRepository;
import collzap.backend.repositories.ChatMessageRepository;
import collzap.backend.repositories.ConnectionTypeSelectionRepository;
import collzap.backend.repositories.DeviceTokenRepository;
import collzap.backend.repositories.InterestFeedbackRepository;
import collzap.backend.repositories.MatchMemberRepository;
import collzap.backend.repositories.MessageReceiptRepository;
import collzap.backend.repositories.NotificationRepository;
import collzap.backend.repositories.OtpCodeRepository;
import collzap.backend.repositories.RefreshTokenRepository;
import collzap.backend.repositories.SeriousnessTestAnswerRepository;
import collzap.backend.repositories.SeriousnessTestAttemptRepository;
import collzap.backend.repositories.SeriousnessTestAttemptQuestionRepository;
import collzap.backend.repositories.UserInterestSelectionRepository;
import collzap.backend.repositories.UserProjectTypeSelectionRepository;
import collzap.backend.repositories.UserRepository;
import collzap.backend.repositories.VerificationDocumentRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final CollegeService collegeService;
    private final UserInterestSelectionRepository interestSelectionRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final MatchMemberRepository matchMemberRepository;
    private final SeriousnessLevelLookup levelLookup;

    // Repositories needed for hard delete
    private final VerificationDocumentRepository verificationDocumentRepository;
    private final NotificationRepository notificationRepository;
    private final MessageReceiptRepository messageReceiptRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final SeriousnessTestAnswerRepository testAnswerRepository;
    private final SeriousnessTestAttemptQuestionRepository sessionQuestionRepository;
    private final SeriousnessTestAttemptRepository testAttemptRepository;
    private final InterestFeedbackRepository interestFeedbackRepository;
    private final ConnectionTypeSelectionRepository connectionTypeSelectionRepository;
    private final UserProjectTypeSelectionRepository projectTypeSelectionRepository;
    private final BlockReportRepository blockReportRepository;
    private final OtpCodeRepository otpCodeRepository;
    private final TaskDataPurger taskDataPurger;

    public UserService(
        UserRepository userRepository,
        CollegeService collegeService,
        UserInterestSelectionRepository interestSelectionRepository,
        DeviceTokenRepository deviceTokenRepository,
        RefreshTokenRepository refreshTokenRepository,
        MatchMemberRepository matchMemberRepository,
        SeriousnessLevelLookup levelLookup,
        VerificationDocumentRepository verificationDocumentRepository,
        NotificationRepository notificationRepository,
        MessageReceiptRepository messageReceiptRepository,
        ChatMessageRepository chatMessageRepository,
        SeriousnessTestAnswerRepository testAnswerRepository,
        SeriousnessTestAttemptQuestionRepository sessionQuestionRepository,
        SeriousnessTestAttemptRepository testAttemptRepository,
        InterestFeedbackRepository interestFeedbackRepository,
        ConnectionTypeSelectionRepository connectionTypeSelectionRepository,
        UserProjectTypeSelectionRepository projectTypeSelectionRepository,
        BlockReportRepository blockReportRepository,
        OtpCodeRepository otpCodeRepository,
        TaskDataPurger taskDataPurger
    ) {
        this.taskDataPurger = taskDataPurger;
        this.userRepository = userRepository;
        this.collegeService = collegeService;
        this.interestSelectionRepository = interestSelectionRepository;
        this.deviceTokenRepository = deviceTokenRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.matchMemberRepository = matchMemberRepository;
        this.levelLookup = levelLookup;
        this.verificationDocumentRepository = verificationDocumentRepository;
        this.notificationRepository = notificationRepository;
        this.messageReceiptRepository = messageReceiptRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.testAnswerRepository = testAnswerRepository;
        this.sessionQuestionRepository = sessionQuestionRepository;
        this.testAttemptRepository = testAttemptRepository;
        this.interestFeedbackRepository = interestFeedbackRepository;
        this.connectionTypeSelectionRepository = connectionTypeSelectionRepository;
        this.projectTypeSelectionRepository = projectTypeSelectionRepository;
        this.blockReportRepository = blockReportRepository;
        this.otpCodeRepository = otpCodeRepository;
    }

    /**
     * Looks up an arbitrary user by id — for resolving someone OTHER than the
     * caller (an admin viewing a student, a peer profile's target). A 404/403
     * here is about that other account's state, not the caller's own session.
     */
    @Transactional(readOnly = true)
    public User require(UUID userId) {
        User user = userRepository.findWithCollegeById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        if (user.getAccountStatus() == Status.DELETED) {
            throw new ForbiddenException("This account has been deleted");
        }
        return user;
    }

    /**
     * Resolves the authenticated caller's own account. Unlike {@link #require},
     * a missing or deleted row here means the JWT no longer corresponds to a
     * real session — thrown as 401, not 404/403, so the frontend's existing
     * refresh-then-logout flow kicks in automatically (a refresh attempt then
     * fails too, since an admin hard-delete also removes the refresh token
     * row) instead of leaving the caller stuck on a dead page. Use this
     * wherever {@code userId} comes straight from the authenticated principal.
     */
    @Transactional(readOnly = true)
    public User requireSelf(UUID userId) {
        User user = userRepository.findWithCollegeById(userId).orElse(null);
        if (user == null || user.getAccountStatus() == Status.DELETED) {
            throw new UnauthorizedException("Your account no longer exists. Please sign in again.");
        }
        return user;
    }

    @Transactional(readOnly = true)
    public UserResponse me(UUID userId) {
        return toResponse(requireSelf(userId));
    }

    /**
     * Profile setup and later edits both land here. College is mandatory and can be
     * changed, but only to the one that owns the user's email domain — the email is
     * what was verified, so it stays the source of truth.
     */
    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = requireSelf(userId);
        College college = collegeService.getById(request.collegeId());

        // Once approved, the college is what was verified (by email domain or by
        // an admin checking a document against it). Letting it change afterwards
        // would let a user move into any other college's matching pool.
        if (user.getVerificationStatus() == VerificationStatus.APPROVED
            && user.getCollege() != null
            && !user.getCollege().getId().equals(college.getId())) {
            throw new ConflictException("Your college is verified and can't be changed. Contact support if it's wrong.");
        }

        user.setCollege(college);
        user.setName(request.name().trim());
        user.setProfilePhotoUrl(trimToNull(request.profilePhotoUrl()));
        user.setYearOfStudy(request.yearOfStudy());
        user.setCity(trimToNull(request.city()));
        user.setCourse(trimToNull(request.course()));
        user.setStoryPrompt1(trimToNull(request.storyPrompt1()));
        user.setStoryPrompt2(trimToNull(request.storyPrompt2()));
        user.setStoryPrompt3(trimToNull(request.storyPrompt3()));
        user.setProofOfWorkUrl(trimToNull(request.proofOfWorkUrl()));
        user.setProfileCompleted(user.profileCompletionPercent() == 100);

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public UserResponse updatePhoto(UUID userId, UpdatePhotoRequest request) {
        User user = requireSelf(userId);
        user.setProfilePhotoUrl(request.profilePhotoUrl().trim());
        user.setProfileCompleted(user.profileCompletionPercent() == 100);
        return toResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public SettingsResponse settings(UUID userId) {
        User user = requireSelf(userId);
        return new SettingsResponse(user.isNotificationsEnabled(), user.isProfileVisible());
    }

    @Transactional
    public SettingsResponse updateSettings(UUID userId, UpdateSettingsRequest request) {
        User user = requireSelf(userId);
        if (request.notificationsEnabled() != null) {
            user.setNotificationsEnabled(request.notificationsEnabled());
        }
        if (request.profileVisible() != null) {
            user.setProfileVisible(request.profileVisible());
        }
        userRepository.save(user);
        return new SettingsResponse(user.isNotificationsEnabled(), user.isProfileVisible());
    }

    /**
     * A peer's profile. Only visible to someone who shares a live match group, so
     * the directory cannot be walked by guessing ids.
     */
    @Transactional(readOnly = true)
    public PeerProfileResponse peerProfile(UUID viewerId, UUID targetId) {
        if (viewerId.equals(targetId)) {
            return toPeerProfile(requireSelf(targetId));
        }
        if (!sharesGroup(viewerId, targetId)) {
            throw new ForbiddenException("You can only view profiles of peers you are connected with");
        }
        User target = require(targetId);
        if (!target.isProfileVisible()) {
            throw new ForbiddenException("This peer has hidden their profile");
        }
        return toPeerProfile(target);
    }

    @Transactional
    public void registerDevice(UUID userId, RegisterDeviceRequest request) {
        User user = requireSelf(userId);
        String token = request.token().trim();
        deviceTokenRepository.findByToken(token).ifPresentOrElse(
            existing -> {
                existing.setUser(user);
                existing.setPlatform(trimToNull(request.platform()));
                deviceTokenRepository.save(existing);
            },
            () -> deviceTokenRepository.save(
                new DeviceToken(user, token, trimToNull(request.platform())))
        );
    }

    @Transactional
    public void unregisterDevice(UUID userId, String token) {
        deviceTokenRepository.findByToken(token)
            .filter(device -> device.getUser().getId().equals(userId))
            .ifPresent(deviceTokenRepository::delete);
    }

    @Transactional
    public void touchLastSeen(UUID userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setLastSeenAt(Instant.now());
            userRepository.save(user);
        });
    }

    /**
     * Hard delete: completely erases the user and all associated data from the
     * database. Group membership is torn down separately by
     * {@code MatchingService.leaveAllGroups}, which the caller runs first.
     *
     * <p>Deletion order respects foreign key constraints: deepest children first.
     */
    @Transactional
    public void deleteAccount(UUID userId) {
        User user = userRepository.findWithCollegeById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        String email = user.getEmail();

        // 1. Seriousness test data (deepest children first)
        testAnswerRepository.deleteByUserId(userId);
        sessionQuestionRepository.deleteByUserId(userId);
        testAttemptRepository.deleteByUserId(userId);

        // 2. Chat data: receipts reference messages, so delete receipts first,
        //    then delete receipts on user's own messages by other users,
        //    then delete the messages themselves
        messageReceiptRepository.deleteByUserId(userId);
        // Also delete receipts that OTHER users have for messages SENT by this user
        List<ChatMessage> sentMessages = chatMessageRepository.findBySenderId(userId);
        for (ChatMessage msg : sentMessages) {
            messageReceiptRepository.findByMessageIdIn(List.of(msg.getId()))
                .forEach(messageReceiptRepository::delete);
        }
        chatMessageRepository.deleteBySenderId(userId);

        // 2b. Daily tasks, peer reviews, solo tasks, sessions watched, points/streak
        taskDataPurger.purge(userId);

        // 3. Match membership (leaveAllGroups already deactivated, but hard-delete the rows)
        matchMemberRepository.deleteByUserId(userId);

        // 4. Blocks and reports (both directions)
        blockReportRepository.deleteByReporterIdOrReportedId(userId);

        // 5. Selections and preferences
        interestSelectionRepository.deleteByUserId(userId);
        interestFeedbackRepository.deleteByUserId(userId);
        connectionTypeSelectionRepository.deleteByUserId(userId);
        projectTypeSelectionRepository.deleteByUserId(userId);

        // 6. Verification documents
        verificationDocumentRepository.deleteByUserId(userId);

        // 7. Notifications
        notificationRepository.deleteByUserId(userId);

        // 8. Auth artifacts
        refreshTokenRepository.deleteByUserId(userId);
        deviceTokenRepository.deleteByUserId(userId);
        otpCodeRepository.deleteByEmailIgnoreCase(email);

        // 9. Finally, delete the user entity itself
        userRepository.delete(user);
    }

    private boolean sharesGroup(UUID viewerId, UUID targetId) {
        List<UUID> viewerGroupIds = matchMemberRepository.findActiveWithGroupByUserId(viewerId).stream()
            .map(member -> member.getMatchGroup().getId())
            .toList();
        if (viewerGroupIds.isEmpty()) {
            return false;
        }
        return matchMemberRepository.findActiveWithUserByGroupIdIn(viewerGroupIds).stream()
            .anyMatch(member -> member.getUser().getId().equals(targetId));
    }

    private PeerProfileResponse toPeerProfile(User user) {
        Map<UUID, SeriousnessLevel> levels = levelLookup.levelsByInterest(user.getId());
        List<PeerInterest> interests = interestSelectionRepository
            .findAllWithInterestByUserId(user.getId()).stream()
            .map(selection -> new PeerInterest(
                selection.getInterest().getName(),
                selection.getProjectType(),
                selection.getSubTag(),
                levels.get(selection.getInterest().getId())
            ))
            .toList();

        return new PeerProfileResponse(
            user.getId(),
            user.getName(),
            user.getProfilePhotoUrl(),
            user.getCollege() == null ? null : user.getCollege().getName(),
            user.getYearOfStudy(),
            user.getCity(),
            user.getCourse(),
            user.getStoryPrompt1(),
            user.getStoryPrompt2(),
            user.getStoryPrompt3(),
            user.getProofOfWorkUrl(),
            interests
        );
    }

    public static UserResponse toResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getName(),
            user.getCollege() == null ? null : user.getCollege().getId(),
            user.getCollege() == null ? null : user.getCollege().getName(),
            user.getProfilePhotoUrl(),
            user.getYearOfStudy(),
            user.getCity(),
            user.getCourse(),
            user.getStoryPrompt1(),
            user.getStoryPrompt2(),
            user.getStoryPrompt3(),
            user.getProofOfWorkUrl(),
            user.getVerificationStatus(),
            user.getRejectionReason(),
            user.isProfileCompleted(),
            user.profileCompletionPercent(),
            user.isNotificationsEnabled(),
            user.isProfileVisible(),
            user.getAccountStatus(),
            user.getCreatedAt()
        );
    }

    static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
