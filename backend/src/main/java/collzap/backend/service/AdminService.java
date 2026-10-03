package collzap.backend.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import collzap.backend.dto.AdminDtos.AdminMatchRow;
import collzap.backend.dto.AdminDtos.AdminQueueRow;
import collzap.backend.dto.AdminDtos.AdminReportRow;
import collzap.backend.dto.AdminDtos.AdminStatsResponse;
import collzap.backend.dto.AdminDtos.AdminUserRow;
import collzap.backend.dto.AdminDtos.CreateMatchRequest;
import collzap.backend.dto.AdminDtos.DeleteUserRequest;
import collzap.backend.dto.AdminDtos.InterestFeedbackRow;
import collzap.backend.dto.AdminDtos.PendingVerificationRow;
import collzap.backend.dto.AdminDtos.UnmatchRequest;
import collzap.backend.dto.CollegeDtos.ReviewDocumentRequest;
import collzap.backend.dto.CollegeDtos.VerificationDocumentResponse;
import collzap.backend.dto.CommonDtos.PageResponse;
import collzap.backend.dto.MatchDtos.MatchGroupResponse;
import collzap.backend.enums.DocumentStatus;
import collzap.backend.enums.MatchGroupStatus;
import collzap.backend.enums.Status;
import collzap.backend.enums.VerificationStatus;
import collzap.backend.exception.BadRequestException;
import collzap.backend.exception.NotFoundException;
import collzap.backend.models.AdminUser;
import collzap.backend.models.Interest;
import collzap.backend.models.MatchGroup;
import collzap.backend.models.MatchMember;
import collzap.backend.models.User;
import collzap.backend.repositories.AdminUserRepository;
import collzap.backend.repositories.ChatMessageRepository;
import collzap.backend.repositories.InterestFeedbackRepository;
import collzap.backend.repositories.InterestRepository;
import collzap.backend.repositories.MatchGroupRepository;
import collzap.backend.repositories.MatchMemberRepository;
import collzap.backend.repositories.SeriousnessTestAttemptRepository;
import collzap.backend.repositories.UserInterestSelectionRepository;
import collzap.backend.repositories.UserRepository;
import collzap.backend.repositories.VerificationDocumentRepository;
import collzap.backend.exception.ConflictException;
import collzap.backend.dto.InterestDtos.CreateInterestRequest;
import collzap.backend.dto.InterestDtos.InterestResponse;
import collzap.backend.dto.InterestDtos.UpdateInterestRequest;

/**
 * Everything behind {@code /admin}. This layer reads across the whole database
 * and delegates any state change to the service that owns it, so an operator
 * approving a document or forcing a match goes through exactly the same rules and
 * notifications as the normal flow.
 */
@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);

    private final UserRepository userRepository;
    private final UserService userService;
    private final VerificationDocumentRepository verificationDocumentRepository;
    private final MatchGroupRepository matchGroupRepository;
    private final MatchMemberRepository matchMemberRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final InterestRepository interestRepository;
    private final InterestFeedbackRepository interestFeedbackRepository;
    private final AdminUserRepository adminUserRepository;
    private final VerificationService verificationService;
    private final MatchingService matchingService;
    private final ModerationService moderationService;
    private final collzap.backend.repositories.SeriousnessTestQuestionRepository questionRepository;
    private final collzap.backend.repositories.SeriousnessTestAttemptQuestionRepository attemptQuestionRepository;
    private final collzap.backend.repositories.SeriousnessTestAnswerRepository answerRepository;
    private final SeriousnessTestAttemptRepository attemptRepository;
    private final UserInterestSelectionRepository userInterestSelectionRepository;
    private final CollegeApplicationService collegeApplicationService;
    private final collzap.backend.repositories.UserTaskStatsRepository userTaskStatsRepository;
    private final SeriousnessLevelLookup seriousnessLevelLookup;

    public AdminService(
        UserRepository userRepository,
        UserService userService,
        VerificationDocumentRepository verificationDocumentRepository,
        MatchGroupRepository matchGroupRepository,
        MatchMemberRepository matchMemberRepository,
        ChatMessageRepository chatMessageRepository,
        InterestRepository interestRepository,
        InterestFeedbackRepository interestFeedbackRepository,
        AdminUserRepository adminUserRepository,
        VerificationService verificationService,
        MatchingService matchingService,
        ModerationService moderationService,
        collzap.backend.repositories.SeriousnessTestQuestionRepository questionRepository,
        collzap.backend.repositories.SeriousnessTestAttemptQuestionRepository attemptQuestionRepository,
        collzap.backend.repositories.SeriousnessTestAnswerRepository answerRepository,
        SeriousnessTestAttemptRepository attemptRepository,
        UserInterestSelectionRepository userInterestSelectionRepository,
        CollegeApplicationService collegeApplicationService,
        collzap.backend.repositories.UserTaskStatsRepository userTaskStatsRepository,
        SeriousnessLevelLookup seriousnessLevelLookup
    ) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.verificationDocumentRepository = verificationDocumentRepository;
        this.matchGroupRepository = matchGroupRepository;
        this.matchMemberRepository = matchMemberRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.interestRepository = interestRepository;
        this.interestFeedbackRepository = interestFeedbackRepository;
        this.adminUserRepository = adminUserRepository;
        this.verificationService = verificationService;
        this.matchingService = matchingService;
        this.moderationService = moderationService;
        this.questionRepository = questionRepository;
        this.attemptQuestionRepository = attemptQuestionRepository;
        this.answerRepository = answerRepository;
        this.attemptRepository = attemptRepository;
        this.userInterestSelectionRepository = userInterestSelectionRepository;
        this.collegeApplicationService = collegeApplicationService;
        this.userTaskStatsRepository = userTaskStatsRepository;
        this.seriousnessLevelLookup = seriousnessLevelLookup;
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse stats() {
        return new AdminStatsResponse(
            userRepository.count(),
            userRepository.countByVerificationStatus(VerificationStatus.APPROVED),
            verificationDocumentRepository.countByStatus(DocumentStatus.PENDING),
            matchGroupRepository.countByStatus(MatchGroupStatus.ACTIVE),
            matchGroupRepository.countByStatus(MatchGroupStatus.WAITING),
            chatMessageRepository.count()
        );
    }

    /** The all-users table. {@code status} defaults to active accounts. */
    @Transactional(readOnly = true)
    public PageResponse<AdminUserRow> users(
        String search, Status status, VerificationStatus verificationStatus, Pageable pageable
    ) {
        String needle = search == null || search.isBlank() ? null : search.trim();
        return PageResponse.from(
            userRepository.searchActive(status, verificationStatus, needle, pageable),
            user -> new AdminUserRow(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getCollege() == null ? null : user.getCollege().getName(),
                user.getVerificationStatus(),
                user.getAccountStatus(),
                user.isProfileCompleted(),
                user.getCreatedAt()
            )
        );
    }

    @Transactional(readOnly = true)
    public collzap.backend.dto.AdminDtos.AdminUserDetailResponse user(UUID userId) {
        User user = userRepository.findWithCollegeById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));
        var stats = userTaskStatsRepository.findByUserId(userId).orElse(null);
        var seriousnessLevels = seriousnessLevelLookup.latestByInterest(userId).values().stream()
            .filter(attempt -> attempt.getLevel() != null)
            .map(attempt -> new collzap.backend.dto.AdminDtos.SeriousnessLevelEntry(
                attempt.getInterest().getName(), attempt.getLevel()
            ))
            .toList();
        return new collzap.backend.dto.AdminDtos.AdminUserDetailResponse(
            UserService.toResponse(user),
            stats == null ? 0 : stats.getTotalPoints(),
            stats == null ? 0 : stats.getCurrentStreakDays(),
            stats == null ? 0 : stats.getLongestStreakDays(),
            seriousnessLevels
        );
    }

    /**
     * Permanent, irreversible hard delete — everything the user ever created
     * (matches, chats, messages, verification documents, notifications, auth
     * tokens...) goes with them. Delegates to the same cascade the self-service
     * "delete my account" flow uses, so there is exactly one place that has to
     * get the foreign-key ordering right. The reason is required and logged
     * (not stored against the now-deleted user) as the audit trail for why an
     * operator did this.
     */
    @Transactional
    public void deleteUser(UUID userId, UUID adminId, DeleteUserRequest request) {
        AdminUser operator = adminUserRepository.findById(adminId)
            .orElseThrow(() -> new NotFoundException("Operator account not found"));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User not found"));

        log.warn(
            "Admin '{}' deleting user {} ({}). Reason: {}",
            operator.getUsername(), userId, user.getEmail(), request.reason()
        );

        matchingService.leaveAllGroups(userId);
        userService.deleteAccount(userId);
    }

    /** Documents awaiting manual review, oldest first so nobody is left waiting. */
    @Transactional(readOnly = true)
    public PageResponse<PendingVerificationRow> pendingVerifications(Pageable pageable) {
        return PageResponse.from(
            verificationDocumentRepository.findQueueByStatus(DocumentStatus.PENDING, pageable),
            document -> new PendingVerificationRow(
                document.getId(),
                document.getUser().getId(),
                document.getUser().getName(),
                document.getUser().getEmail(),
                document.getUser().getCollege() == null
                    ? null
                    : document.getUser().getCollege().getName(),
                document.getDocumentType(),
                document.getDocumentUrl(),
                document.getCreatedAt()
            )
        );
    }

    /**
     * Approve or reject a document. Delegates so the user's verification status, the
     * outcome email and the notification all happen exactly as they would anywhere
     * else — the only thing this layer adds is resolving which operator acted.
     */
    @Transactional
    public VerificationDocumentResponse review(
        UUID documentId,
        ReviewDocumentRequest request,
        UUID adminId
    ) {
        AdminUser reviewer = adminUserRepository.findById(adminId)
            .orElseThrow(() -> new NotFoundException("Operator account not found"));
        return verificationService.review(documentId, request, reviewer);
    }

    /** "Bring CollZap to my college" applications. status=null returns every one. */
    @Transactional(readOnly = true)
    public PageResponse<collzap.backend.dto.CollegeApplicationDtos.AdminCollegeApplicationRow> collegeApplications(
        DocumentStatus status,
        Pageable pageable
    ) {
        return collegeApplicationService.list(status, pageable);
    }

    @Transactional
    public collzap.backend.dto.CollegeApplicationDtos.AdminCollegeApplicationRow reviewCollegeApplication(
        UUID applicationId,
        ReviewDocumentRequest request,
        UUID adminId
    ) {
        AdminUser reviewer = adminUserRepository.findById(adminId)
            .orElseThrow(() -> new NotFoundException("Operator account not found"));
        return collegeApplicationService.review(applicationId, request, reviewer);
    }

    /** The matches table, with member names resolved in one extra query. */
    @Transactional(readOnly = true)
    public PageResponse<AdminMatchRow> matches(MatchGroupStatus status, Pageable pageable) {
        Page<MatchGroup> page = status == null
            ? matchGroupRepository.findAdminPage(pageable)
            : matchGroupRepository.findAdminPageByStatus(status, pageable);

        Map<UUID, List<String>> names = memberNames(page.getContent());
        return PageResponse.from(page, group -> new AdminMatchRow(
            group.getId(),
            group.getInterest().getName(),
            group.getCollege().getName(),
            group.getProjectType(),
            group.getConnectionType(),
            group.getStatus(),
            group.getLevelBand(),
            group.getMemberCount(),
            group.getMaxMembers(),
            names.getOrDefault(group.getId(), List.of()),
            group.getCreatedAt(),
            group.getOpenedAt()
        ));
    }

    /** The waiting queue, longest wait first — the view an operator acts on. */
    @Transactional(readOnly = true)
    public List<AdminQueueRow> waitingQueue() {
        List<MatchGroup> waiting =
            matchGroupRepository.findByStatusOldestFirst(MatchGroupStatus.WAITING);
        Map<UUID, List<String>> names = memberNames(waiting);

        List<AdminQueueRow> rows = new ArrayList<>(waiting.size());
        for (MatchGroup group : waiting) {
            rows.add(new AdminQueueRow(
                group.getId(),
                group.getInterest().getName(),
                group.getCollege().getName(),
                group.getProjectType(),
                group.getConnectionType(),
                group.getLevelBand(),
                group.getCreatedAt(),
                MatchAssembler.waitedSeconds(group),
                names.getOrDefault(group.getId(), List.of())
            ));
        }
        return rows;
    }

    @Transactional
    public MatchGroupResponse createMatch(CreateMatchRequest request) {
        Interest interest = interestRepository.findById(request.interestId())
            .orElseThrow(() -> new NotFoundException("Interest not found"));
        return matchingService.createManualMatch(
            request.userIds(),
            interest,
            request.connectionType(),
            request.projectType()
        );
    }

    @Transactional
    public void unmatch(UnmatchRequest request) {
        matchingService.unmatch(request.matchGroupId(), request.userId());
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminReportRow> reports(Pageable pageable) {
        return moderationService.reports(pageable);
    }

    @Transactional(readOnly = true)
    public PageResponse<InterestFeedbackRow> interestFeedback(Pageable pageable) {
        return PageResponse.from(
            interestFeedbackRepository.findAllByOrderByCreatedAtDesc(pageable),
            feedback -> new InterestFeedbackRow(
                feedback.getId(),
                feedback.getUser().getId(),
                feedback.getUser().getName(),
                feedback.getProjectType(),
                feedback.getSuggestion(),
                feedback.getCreatedAt()
            )
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<collzap.backend.dto.AdminDtos.AdminQuestionResponse> questions(UUID interestId, Pageable pageable) {
        Page<collzap.backend.models.SeriousnessTestQuestion> page = interestId == null
            ? questionRepository.findAll(pageable)
            : questionRepository.findByInterestId(interestId, pageable);

        return PageResponse.from(page, q -> new collzap.backend.dto.AdminDtos.AdminQuestionResponse(
            q.getId(),
            q.getQuestionText(),
            toOptionDtos(q.getOptions()),
            q.getInterest().getId(),
            q.getInterest().getName()
        ));
    }

    @Transactional(readOnly = true)
    public List<InterestResponse> allInterests() {
        return interestRepository.findAll().stream()
            .map(AdminService::toInterestResponse)
            .toList();
    }

    @CacheEvict(value = "interestCatalog", allEntries = true)
    @Transactional
    public InterestResponse createInterest(CreateInterestRequest request) {
        String name = request.name().trim();
        if (interestRepository.existsByNameIgnoreCaseAndCategory(name, request.category())) {
            throw new ConflictException("An interest named \"" + name + "\" already exists in this category");
        }
        int nextOrder = interestRepository.findFirstByCategoryOrderByDisplayOrderDesc(request.category())
            .map(i -> i.getDisplayOrder() + 1)
            .orElse(1);
        Interest interest = interestRepository.save(new Interest(name, request.category(), nextOrder));
        return toInterestResponse(interest);
    }

    @CacheEvict(value = "interestCatalog", allEntries = true)
    @Transactional
    public InterestResponse updateInterest(UUID id, UpdateInterestRequest request) {
        Interest interest = interestRepository.findById(id)
            .orElseThrow(() -> NotFoundException.of("Interest"));
        String name = request.name().trim();
        if (!name.equalsIgnoreCase(interest.getName())
            && interestRepository.existsByNameIgnoreCaseAndCategory(name, interest.getCategory())) {
            throw new ConflictException("An interest named \"" + name + "\" already exists in this category");
        }
        interest.setName(name);
        interest = interestRepository.save(interest);
        return toInterestResponse(interest);
    }

    /**
     * Deletes an interest and its entire question bank (plus those questions'
     * attempt-question/answer rows). Blocked outright if the interest still has
     * any match groups, test attempts, or user selections — those aren't safe to
     * cascade silently; the operator has to resolve them first.
     */
    @CacheEvict(value = "interestCatalog", allEntries = true)
    @Transactional
    public void deleteInterest(UUID id) {
        Interest interest = interestRepository.findById(id)
            .orElseThrow(() -> NotFoundException.of("Interest"));

        long matchCount = matchGroupRepository.countByInterestId(id);
        long attemptCount = attemptRepository.countByInterestId(id);
        long selectionCount = userInterestSelectionRepository.countByInterestId(id);

        if (matchCount > 0 || attemptCount > 0 || selectionCount > 0) {
            List<String> reasons = new ArrayList<>();
            if (matchCount > 0) reasons.add(matchCount + " match group(s)");
            if (attemptCount > 0) reasons.add(attemptCount + " test attempt(s)");
            if (selectionCount > 0) reasons.add(selectionCount + " user selection(s)");
            throw new ConflictException(
                "Cannot delete \"" + interest.getName() + "\": " + String.join(", ", reasons) + " still reference it"
            );
        }

        answerRepository.deleteByQuestionInterestId(id);
        attemptQuestionRepository.deleteByQuestionInterestId(id);
        questionRepository.deleteByInterestId(id);
        interestRepository.delete(interest);
    }

    private static InterestResponse toInterestResponse(Interest interest) {
        return new InterestResponse(
            interest.getId(), interest.getName(), interest.getCategory(), interest.getDisplayOrder()
        );
    }

    @Transactional
    public collzap.backend.dto.AdminDtos.AdminQuestionResponse createQuestion(collzap.backend.dto.AdminDtos.QuestionRequest request) {
        Interest interest = interestRepository.findById(request.interestId())
            .orElseThrow(() -> new NotFoundException("Interest not found"));

        List<collzap.backend.models.QuestionOption> options = toOptions(request.options());
        collzap.backend.models.SeriousnessTestQuestion question = new collzap.backend.models.SeriousnessTestQuestion(
            interest,
            request.questionText().trim(),
            options
        );
        question = questionRepository.save(question);

        return new collzap.backend.dto.AdminDtos.AdminQuestionResponse(
            question.getId(),
            question.getQuestionText(),
            toOptionDtos(question.getOptions()),
            interest.getId(),
            interest.getName()
        );
    }

    @Transactional
    public collzap.backend.dto.AdminDtos.AdminQuestionResponse updateQuestion(UUID id, collzap.backend.dto.AdminDtos.QuestionRequest request) {
        collzap.backend.models.SeriousnessTestQuestion question = questionRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Question not found"));

        Interest interest = interestRepository.findById(request.interestId())
            .orElseThrow(() -> new NotFoundException("Interest not found"));

        question.setQuestionText(request.questionText().trim());
        question.setOptions(toOptions(request.options()));
        question.setInterest(interest);

        question = questionRepository.save(question);

        return new collzap.backend.dto.AdminDtos.AdminQuestionResponse(
            question.getId(),
            question.getQuestionText(),
            toOptionDtos(question.getOptions()),
            interest.getId(),
            interest.getName()
        );
    }

    /** Rejects a question none of whose options carry any points — it could never contribute to a score. */
    private static List<collzap.backend.models.QuestionOption> toOptions(
        List<collzap.backend.dto.AdminDtos.QuestionOptionDto> options
    ) {
        int maxPoints = options.stream().mapToInt(collzap.backend.dto.AdminDtos.QuestionOptionDto::points).max().orElse(0);
        if (maxPoints <= 0) {
            throw new BadRequestException("At least one option must carry points");
        }
        return options.stream()
            .map(o -> new collzap.backend.models.QuestionOption(o.text().trim(), o.points()))
            .toList();
    }

    private static List<collzap.backend.dto.AdminDtos.QuestionOptionDto> toOptionDtos(
        List<collzap.backend.models.QuestionOption> options
    ) {
        return options.stream()
            .map(o -> new collzap.backend.dto.AdminDtos.QuestionOptionDto(o.text(), o.points()))
            .toList();
    }

    @Transactional
    public void deleteQuestion(UUID id) {
        collzap.backend.models.SeriousnessTestQuestion question = questionRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Question not found"));
        questionRepository.delete(question);
    }

    /**
     * Wipes the entire question bank. Attempt-question and answer rows are removed
     * first since both hold a non-nullable FK to the question — any in-progress or
     * historical attempts lose their per-question detail and recorded answers, but
     * the attempt records themselves (status, score) are untouched.
     */
    @Transactional
    public long deleteAllQuestions() {
        long count = questionRepository.count();
        answerRepository.deleteAllInBatch();
        attemptQuestionRepository.deleteAllInBatch();
        questionRepository.deleteAllInBatch();
        return count;
    }

    @Transactional(readOnly = true)
    public long operatorCount() {
        return adminUserRepository.count();
    }

    private Map<UUID, List<String>> memberNames(List<MatchGroup> groups) {
        if (groups.isEmpty()) {
            return Map.of();
        }
        List<UUID> groupIds = groups.stream().map(MatchGroup::getId).toList();
        Map<UUID, List<String>> names = new HashMap<>();
        for (MatchMember member : matchMemberRepository.findActiveWithUserByGroupIdIn(groupIds)) {
            names
                .computeIfAbsent(member.getMatchGroup().getId(), key -> new ArrayList<>())
                .add(member.getUser().getName());
        }
        return names;
    }
}
