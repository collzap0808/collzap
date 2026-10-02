package collzap.backend.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import collzap.backend.config.CollzapProperties;
import collzap.backend.dto.MatchDtos.CircleResponse;
import collzap.backend.dto.MatchDtos.FindMatchesResponse;
import collzap.backend.dto.MatchDtos.MatchGroupResponse;
import collzap.backend.dto.MatchDtos.MatchOutcome;
import collzap.backend.dto.MatchDtos.MatchResultResponse;
import collzap.backend.enums.ConnectionType;
import collzap.backend.enums.MatchGroupStatus;
import collzap.backend.enums.NotificationType;
import collzap.backend.enums.ProjectType;
import collzap.backend.enums.SeriousnessLevel;
import collzap.backend.enums.VerificationStatus;
import collzap.backend.exception.BadRequestException;
import collzap.backend.exception.ConflictException;
import collzap.backend.exception.ForbiddenException;
import collzap.backend.exception.NotFoundException;
import collzap.backend.models.ChatRoom;
import collzap.backend.models.ConnectionTypeSelection;
import collzap.backend.models.Interest;
import collzap.backend.models.MatchGroup;
import collzap.backend.models.MatchMember;
import collzap.backend.models.User;
import collzap.backend.models.UserInterestSelection;
import collzap.backend.repositories.BlockReportRepository;
import collzap.backend.repositories.ChatRoomRepository;
import collzap.backend.repositories.ConnectionTypeSelectionRepository;
import collzap.backend.repositories.MatchGroupRepository;
import collzap.backend.repositories.MatchMemberRepository;
import collzap.backend.repositories.UserInterestSelectionRepository;
import collzap.backend.repositories.UserRepository;

/**
 * Auto matching. A user is placed into a bucket that shares their college,
 * interest, connection type and seriousness level, within one level either side.
 * A bucket in WAITING is the queue entry; it becomes ACTIVE and gains a chat room
 * as soon as it has enough members.
 *
 * <p>CLOSED means a group has been dissolved, not that it is full — fullness is
 * {@code memberCount == maxMembers}, which is what keeps a short group at four
 * while still letting it accept members three and four after it opened at two.
 */
@Service
public class MatchingService {

    private static final Logger log = LoggerFactory.getLogger(MatchingService.class);

    private final UserRepository userRepository;
    private final UserInterestSelectionRepository selectionRepository;
    private final ConnectionTypeSelectionRepository connectionTypeRepository;
    private final MatchGroupRepository matchGroupRepository;
    private final MatchMemberRepository matchMemberRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final BlockReportRepository blockReportRepository;
    private final SeriousnessLevelLookup levelLookup;
    private final MatchAssembler matchAssembler;
    private final NotificationService notificationService;
    private final ChatBroadcaster chatBroadcaster;
    private final UserService userService;
    private final CollzapProperties properties;
    private final MatchingAccessService matchingAccessService;

    public MatchingService(
        UserRepository userRepository,
        UserInterestSelectionRepository selectionRepository,
        ConnectionTypeSelectionRepository connectionTypeRepository,
        MatchGroupRepository matchGroupRepository,
        MatchMemberRepository matchMemberRepository,
        ChatRoomRepository chatRoomRepository,
        BlockReportRepository blockReportRepository,
        SeriousnessLevelLookup levelLookup,
        MatchAssembler matchAssembler,
        NotificationService notificationService,
        ChatBroadcaster chatBroadcaster,
        UserService userService,
        CollzapProperties properties,
        MatchingAccessService matchingAccessService
    ) {
        this.matchingAccessService = matchingAccessService;
        this.userRepository = userRepository;
        this.selectionRepository = selectionRepository;
        this.connectionTypeRepository = connectionTypeRepository;
        this.matchGroupRepository = matchGroupRepository;
        this.matchMemberRepository = matchMemberRepository;
        this.chatRoomRepository = chatRoomRepository;
        this.blockReportRepository = blockReportRepository;
        this.levelLookup = levelLookup;
        this.matchAssembler = matchAssembler;
        this.notificationService = notificationService;
        this.chatBroadcaster = chatBroadcaster;
        this.userService = userService;
        this.properties = properties;
    }

    /**
     * Runs the matcher once for every interest the user selected. Each interest is
     * independent: one may match while another queues.
     */
    @Transactional
    public FindMatchesResponse findMatches(UUID userId) {
        User user = userService.requireSelf(userId);
        if (user.getVerificationStatus() != VerificationStatus.APPROVED) {
            throw new ForbiddenException(
                "Your college verification is still being reviewed. We will open matching as soon as it clears.");
        }
        // New students earn matching with solo daily tasks first. Admin manual
        // matches (createManualMatch) deliberately skip this check.
        matchingAccessService.requireUnlocked(user);

        Map<ProjectType, ConnectionType> connectionTypes = connectionTypesOf(userId);
        List<UserInterestSelection> selections = selectionRepository.findAllWithInterestByUserId(userId);
        if (selections.isEmpty()) {
            throw new BadRequestException("Pick your interests before finding peers");
        }

        List<MatchResultResponse> results = new ArrayList<>(selections.size());
        for (UserInterestSelection selection : selections) {
            ConnectionType connectionType = connectionTypes.get(selection.getProjectType());
            if (connectionType == null) {
                throw new BadRequestException(
                    "Choose a connection type for %s first"
                        .formatted(InterestService.label(selection.getProjectType())));
            }
            results.add(matchOne(user, selection, connectionType));
        }
        return new FindMatchesResponse(results);
    }

    /** The Circle tab: everything live, plus everything still queued. */
    @Transactional(readOnly = true)
    public CircleResponse circle(UUID userId) {
        List<MatchGroup> groups = matchMemberRepository.findActiveWithGroupByUserId(userId).stream()
            .map(MatchMember::getMatchGroup)
            .toList();

        List<MatchGroup> connections = groups.stream()
            .filter(group -> group.getStatus() == MatchGroupStatus.ACTIVE)
            .toList();
        List<MatchGroup> waiting = groups.stream()
            .filter(group -> group.getStatus() == MatchGroupStatus.WAITING)
            .toList();

        return new CircleResponse(
            matchAssembler.describeAll(connections, userId),
            matchAssembler.describeAll(waiting, userId)
        );
    }

    @Transactional(readOnly = true)
    public MatchGroupResponse group(UUID userId, UUID groupId) {
        MatchGroup group = matchGroupRepository.findById(groupId)
            .orElseThrow(() -> new NotFoundException("Match group not found"));
        if (!matchMemberRepository.existsByMatchGroupIdAndUserIdAndActiveTrue(groupId, userId)) {
            throw new ForbiddenException("You are not part of that group");
        }
        return matchAssembler.describe(group, userId);
    }

    /**
     * The 30-second sweep. Queued groups are re-run through the matcher so two
     * lonely one-member buckets in the same band can be merged, which is what makes
     * the client's "checking every 30 seconds" wait actually resolve.
     *
     * @return how many groups were merged away
     */
    @Transactional
    public int sweepWaitingQueue() {
        List<MatchGroup> waiting = matchGroupRepository.findByStatusOldestFirst(MatchGroupStatus.WAITING);
        int merged = 0;

        for (MatchGroup group : waiting) {
            List<MatchMember> members = matchMemberRepository.findActiveWithUserByGroupId(group.getId());
            if (members.isEmpty()) {
                closeGroup(group, "empty waiting group");
                continue;
            }
            // Only single-member buckets can be folded into another; larger ones are
            // already partway to opening and moving them would churn membership.
            if (members.size() > 1) {
                continue;
            }
            MatchMember lone = members.getFirst();
            Optional<MatchGroup> target = pickCandidate(
                lone.getUser(), group.getInterest(), group.getConnectionType(), group.getLevelBand());
            if (target.isEmpty() || target.get().getId().equals(group.getId())) {
                continue;
            }

            leave(group, lone);
            closeGroup(group, "merged into " + target.get().getId());
            try {
                join(lone.getUser(), target.get());
                merged++;
            } catch (ConflictException ex) {
                // The target filled up between the candidate read and the row lock. Put
                // the user back in their own bucket rather than dropping them from the
                // queue — one lost race must not cost someone their place in line.
                log.debug("Merge of group {} lost the race: {}", group.getId(), ex.getMessage());
                reopen(group, lone);
            }
        }
        if (merged > 0) {
            log.info("Matching sweep merged {} waiting group(s)", merged);
        }
        return merged;
    }

    /** Removes one member, or dissolves the whole group when {@code userId} is null. */
    @Transactional
    public void unmatch(UUID groupId, UUID userId) {
        MatchGroup group = matchGroupRepository.findByIdForUpdate(groupId)
            .orElseThrow(() -> new NotFoundException("Match group not found"));

        if (userId == null) {
            List<MatchMember> members = matchMemberRepository.findActiveWithUserByGroupId(groupId);
            List<User> affected = members.stream().map(MatchMember::getUser).toList();
            members.forEach(member -> leave(group, member));
            closeGroup(group, "dissolved");
            notifyUnmatched(affected, group);
            return;
        }

        MatchMember member = matchMemberRepository.findByMatchGroupIdAndUserId(groupId, userId)
            .filter(MatchMember::isActive)
            .orElseThrow(() -> new NotFoundException("That user is not in this group"));
        leave(group, member);
        notifyUnmatched(List.of(member.getUser()), group);

        if (group.getMemberCount() == 0) {
            closeGroup(group, "last member left");
        } else if (group.getConnectionType() == ConnectionType.ONE_ON_ONE) {
            // A one-on-one with one person left is not a conversation, so the survivor
            // goes back in the queue instead of staring at a dead chat.
            group.setStatus(MatchGroupStatus.WAITING);
            group.setOpenedAt(null);
            matchGroupRepository.save(group);
        }
    }

    /** Group ids two users actively share — what a block has to tear down. */
    @Transactional(readOnly = true)
    public List<UUID> sharedActiveGroupIds(UUID userId, UUID otherId) {
        Set<UUID> theirs = matchMemberRepository.findActiveWithGroupByUserId(otherId).stream()
            .map(member -> member.getMatchGroup().getId())
            .collect(Collectors.toSet());
        return matchMemberRepository.findActiveWithGroupByUserId(userId).stream()
            .map(member -> member.getMatchGroup().getId())
            .filter(theirs::contains)
            .toList();
    }

    /**
     * Pulls a user out of every group they are in, used when an account is deleted.
     * Routed through {@link #unmatch} on purpose: a departing member has to leave the
     * same way whatever the reason, so the remaining side of a one-on-one is requeued
     * and told about it instead of being left in a chat nobody will answer.
     */
    @Transactional
    public void leaveAllGroups(UUID userId) {
        List<UUID> groupIds = matchMemberRepository.findActiveWithGroupByUserId(userId).stream()
            .map(member -> member.getMatchGroup().getId())
            .toList();
        groupIds.forEach(groupId -> unmatch(groupId, userId));
    }

    /** Admin manual match: puts a chosen set of users straight into a live group. */
    @Transactional
    public MatchGroupResponse createManualMatch(
        List<UUID> userIds,
        Interest interest,
        ConnectionType connectionType,
        ProjectType projectType
    ) {
        Set<UUID> distinctIds = new HashSet<>(userIds);
        List<User> users = userRepository.findAllWithCollegeByIdIn(List.copyOf(distinctIds));
        if (users.size() != distinctIds.size()) {
            throw new BadRequestException("One or more of those users does not exist");
        }
        if (users.size() < 2) {
            throw new BadRequestException("Pick at least two users to match");
        }
        if (users.size() > connectionType.capacity()) {
            throw new BadRequestException(
                "%s holds at most %d members".formatted(connectionType, connectionType.capacity()));
        }
        if (!connectionType.isAvailableFor(projectType)) {
            throw new BadRequestException(
                "%s is not available for %s".formatted(connectionType, InterestService.label(projectType)));
        }
        Set<UUID> colleges = users.stream()
            .map(user -> user.getCollege().getId())
            .collect(Collectors.toSet());
        if (colleges.size() > 1) {
            throw new BadRequestException("Matches are within a single college");
        }

        // A manual match is a deliberate override, so an untested user does not block
        // it — the band falls back to the short-term default.
        User first = users.getFirst();
        SeriousnessLevel band = levelLookup.levelFor(first.getId(), interest.getId())
            .orElseGet(this::shortTermDefaultLevel);
        MatchGroup group = matchGroupRepository.save(
            new MatchGroup(interest, first.getCollege(), connectionType, projectType, band));

        for (User user : users) {
            group = join(user, group);
        }
        return matchAssembler.describe(group, null);
    }

    private MatchResultResponse matchOne(
        User user,
        UserInterestSelection selection,
        ConnectionType connectionType
    ) {
        Interest interest = selection.getInterest();
        ProjectType projectType = selection.getProjectType();

        Optional<MatchGroup> existing = openGroupFor(user.getId(), interest.getId(), connectionType);
        if (existing.isPresent()) {
            MatchGroup group = existing.get();
            boolean live = group.getStatus() == MatchGroupStatus.ACTIVE;
            return new MatchResultResponse(
                interest.getId(),
                interest.getName(),
                projectType,
                connectionType,
                live ? MatchOutcome.ALREADY_MATCHED : MatchOutcome.QUEUED,
                live
                    ? "You are already connected for %s.".formatted(interest.getName())
                    : queueMessage(interest, connectionType),
                matchAssembler.describe(group, user.getId())
            );
        }

        SeriousnessLevel level = resolveLevel(user, interest.getId(), projectType);
        MatchGroup target = connectionType == ConnectionType.SOCIETY
            ? societyFor(user, interest, projectType, level)
            : pickCandidate(user, interest, connectionType, level)
                .orElseGet(() -> matchGroupRepository.save(
                    new MatchGroup(interest, user.getCollege(), connectionType, projectType, level)));

        MatchGroup group = join(user, target);
        boolean live = group.getStatus() == MatchGroupStatus.ACTIVE;

        return new MatchResultResponse(
            interest.getId(),
            interest.getName(),
            projectType,
            connectionType,
            live ? MatchOutcome.MATCHED : MatchOutcome.QUEUED,
            live ? "You are matched. Say hello!" : queueMessage(interest, connectionType),
            matchAssembler.describe(group, user.getId())
        );
    }

    /** One society room per college and interest; anyone verified joins instantly. */
    private MatchGroup societyFor(User user, Interest interest, ProjectType projectType, SeriousnessLevel level) {
        return matchGroupRepository
            .findFirstByCollegeIdAndInterestIdAndConnectionTypeAndStatusNot(
                user.getCollege().getId(), interest.getId(), ConnectionType.SOCIETY, MatchGroupStatus.CLOSED)
            .orElseGet(() -> matchGroupRepository.save(new MatchGroup(
                interest, user.getCollege(), ConnectionType.SOCIETY, projectType, level)));
    }

    /**
     * Picks the longest-waiting compatible bucket. Level tolerance is ±1 band when
     * enabled, and anyone the user has blocked (either direction) rules a bucket out.
     */
    private Optional<MatchGroup> pickCandidate(
        User user,
        Interest interest,
        ConnectionType connectionType,
        SeriousnessLevel level
    ) {
        List<MatchGroup> candidates = matchGroupRepository.findJoinableCandidates(
            user.getCollege().getId(), interest.getId(), connectionType, user.getId());
        if (candidates.isEmpty()) {
            return Optional.empty();
        }
        Set<UUID> blocked = new HashSet<>(blockReportRepository.findBlockedCounterpartIds(user.getId()));

        for (MatchGroup candidate : candidates) {
            if (!levelCompatible(candidate.getLevelBand(), level)) {
                continue;
            }
            if (!blocked.isEmpty()) {
                List<UUID> memberIds = matchMemberRepository.findActiveUserIdsByGroupId(candidate.getId());
                if (memberIds.stream().anyMatch(blocked::contains)) {
                    continue;
                }
            }
            return Optional.of(candidate);
        }
        return Optional.empty();
    }

    /**
     * Adds a member under a row lock, then opens the group and creates its chat room
     * once the connection type's threshold is met. The lock is what stops two
     * simultaneous joins pushing a short group past four.
     *
     * @return the locked, up-to-date group
     */
    private MatchGroup join(User user, MatchGroup unlocked) {
        MatchGroup group = matchGroupRepository.findByIdForUpdate(unlocked.getId())
            .orElseThrow(() -> new NotFoundException("That group is no longer available"));
        if (matchMemberRepository.existsByMatchGroupIdAndUserIdAndActiveTrue(group.getId(), user.getId())) {
            return group;
        }
        if (!group.acceptsNewMembers()) {
            throw new ConflictException("That group just filled up. Try finding peers again.");
        }

        Instant now = Instant.now();
        matchMemberRepository.save(new MatchMember(group, user, now));
        group.setMemberCount(group.getMemberCount() + 1);

        boolean justOpened = false;
        if (group.getStatus() == MatchGroupStatus.WAITING
            && group.getMemberCount() >= group.getConnectionType().minMembersToOpen()) {
            group.setStatus(MatchGroupStatus.ACTIVE);
            group.setOpenedAt(now);
            justOpened = true;
        }
        matchGroupRepository.save(group);

        if (group.getStatus() != MatchGroupStatus.ACTIVE) {
            return group;
        }
        ChatRoom room = chatRoomRepository.findByMatchGroupId(group.getId())
            .orElseGet(() -> chatRoomRepository.save(
                new ChatRoom(group, group.getConnectionType().chatRoomType())));

        if (justOpened) {
            announceMatch(group, room);
        } else {
            // The group was already live, so this is member three or four arriving.
            chatBroadcaster.memberJoined(
                room.getId(), matchAssembler.describeMember(group, user, now, null));
            notifyExistingMembers(group, room, user);
        }
        return group;
    }

    private void leave(MatchGroup group, MatchMember member) {
        member.setActive(false);
        member.setLeftAt(Instant.now());
        matchMemberRepository.save(member);
        group.setMemberCount(Math.max(0, group.getMemberCount() - 1));
        matchGroupRepository.save(group);
    }

    /** Undoes a failed merge: the user goes back into their own waiting bucket. */
    private void reopen(MatchGroup group, MatchMember member) {
        member.setActive(true);
        member.setLeftAt(null);
        matchMemberRepository.save(member);
        group.setMemberCount(group.getMemberCount() + 1);
        group.setStatus(MatchGroupStatus.WAITING);
        group.setClosedAt(null);
        matchGroupRepository.save(group);
    }

    private void closeGroup(MatchGroup group, String reason) {
        group.setStatus(MatchGroupStatus.CLOSED);
        group.setClosedAt(Instant.now());
        matchGroupRepository.save(group);
        log.debug("Closed match group {}: {}", group.getId(), reason);
    }

    private void announceMatch(MatchGroup group, ChatRoom room) {
        List<User> members = matchMemberRepository.findActiveWithUserByGroupId(group.getId()).stream()
            .map(MatchMember::getUser)
            .toList();
        notificationService.notifyAll(
            members,
            NotificationType.MATCH_FOUND,
            "You have a new peer",
            "You matched for %s. Say hello!".formatted(group.getInterest().getName()),
            Map.of(
                "matchGroupId", group.getId().toString(),
                "chatRoomId", room.getId().toString(),
                "interestName", group.getInterest().getName()
            )
        );
    }

    private void notifyExistingMembers(MatchGroup group, ChatRoom room, User joiner) {
        List<User> others = matchMemberRepository.findActiveWithUserByGroupId(group.getId()).stream()
            .map(MatchMember::getUser)
            .filter(member -> !member.getId().equals(joiner.getId()))
            .toList();
        notificationService.notifyAll(
            others,
            NotificationType.GROUP_MEMBER_JOINED,
            "%s joined your group".formatted(joiner.getName()),
            "Your %s group has %d members now.".formatted(
                group.getInterest().getName(), group.getMemberCount()),
            Map.of(
                "matchGroupId", group.getId().toString(),
                "chatRoomId", room.getId().toString(),
                "userId", joiner.getId().toString()
            )
        );
    }

    private void notifyUnmatched(List<User> users, MatchGroup group) {
        if (users.isEmpty()) {
            return;
        }
        notificationService.notifyAll(
            users,
            NotificationType.UNMATCHED,
            "A connection ended",
            "Your %s connection was closed. Find new peers whenever you are ready."
                .formatted(group.getInterest().getName()),
            Map.of("matchGroupId", group.getId().toString())
        );
    }

    private boolean levelCompatible(SeriousnessLevel band, SeriousnessLevel level) {
        if (band == null || level == null) {
            return true;
        }
        return properties.getMatching().isLevelToleranceEnabled()
            ? band.isCompatibleWith(level)
            : band == level;
    }

    /**
     * Long-Term levels come from the seriousness test. Short-Term buddies never sit
     * it, so they all share the configured default band and effectively match on
     * college plus activity alone.
     */
    private SeriousnessLevel resolveLevel(User user, UUID interestId, ProjectType projectType) {
        if (projectType == ProjectType.SHORT_TERM) {
            return shortTermDefaultLevel();
        }
        return levelLookup.levelFor(user.getId(), interestId)
            .orElseThrow(() -> new BadRequestException(
                "Take the seriousness test before matching for Long-Term peers"));
    }

    private SeriousnessLevel shortTermDefaultLevel() {
        String configured = properties.getMatching().getShortTermDefaultLevel();
        try {
            return SeriousnessLevel.valueOf(configured.trim().toUpperCase());
        } catch (RuntimeException ex) {
            log.warn("collzap.matching.short-term-default-level '{}' is not a level; using LEARNING", configured);
            return SeriousnessLevel.LEARNING;
        }
    }

    private Optional<MatchGroup> openGroupFor(UUID userId, UUID interestId, ConnectionType connectionType) {
        return matchMemberRepository.findActiveWithGroupByUserId(userId).stream()
            .map(MatchMember::getMatchGroup)
            .filter(group -> group.getInterest().getId().equals(interestId))
            .filter(group -> group.getConnectionType() == connectionType)
            .filter(group -> group.getStatus() != MatchGroupStatus.CLOSED)
            .findFirst();
    }

    private Map<ProjectType, ConnectionType> connectionTypesOf(UUID userId) {
        Map<ProjectType, ConnectionType> map = new EnumMap<>(ProjectType.class);
        for (ConnectionTypeSelection selection : connectionTypeRepository.findByUserId(userId)) {
            map.put(selection.getProjectType(), selection.getConnectionType());
        }
        return map;
    }

    private static String queueMessage(Interest interest, ConnectionType connectionType) {
        return switch (connectionType) {
            case ONE_ON_ONE -> "No peer for %s yet. We are looking and will connect you the moment someone matches."
                .formatted(interest.getName());
            case SHORT_GROUP -> "You are first in the %s group. We will open the chat as soon as one more joins."
                .formatted(interest.getName());
            case SOCIETY -> "Setting up the %s society. Hang on a moment.".formatted(interest.getName());
        };
    }
}
