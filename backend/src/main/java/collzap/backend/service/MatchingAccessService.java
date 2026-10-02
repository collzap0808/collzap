package collzap.backend.service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import collzap.backend.config.CollzapProperties;
import collzap.backend.enums.NotificationType;
import collzap.backend.exception.MatchingLockedException;
import collzap.backend.models.User;
import collzap.backend.models.UserTaskStats;
import collzap.backend.repositories.MatchMemberRepository;
import collzap.backend.repositories.UserTaskStatsRepository;

/**
 * Whether peer matching is open for a student. New students start locked and
 * earn their way in with admin-reviewed solo tasks; matching opens once their
 * points reach {@code collzap.matching.unlock-points} (500 by default).
 *
 * <p>Anyone who has ever been in a match group is grandfathered in, and once a
 * user is unlocked {@link UserTaskStats#getMatchingUnlockedAt()} is stamped so
 * it never flips back — not even if the threshold is raised later.
 */
@Service
public class MatchingAccessService {

    private final UserTaskStatsRepository userTaskStatsRepository;
    private final MatchMemberRepository matchMemberRepository;
    private final NotificationService notificationService;
    private final CollzapProperties properties;

    public MatchingAccessService(
        UserTaskStatsRepository userTaskStatsRepository,
        MatchMemberRepository matchMemberRepository,
        NotificationService notificationService,
        CollzapProperties properties
    ) {
        this.userTaskStatsRepository = userTaskStatsRepository;
        this.matchMemberRepository = matchMemberRepository;
        this.notificationService = notificationService;
        this.properties = properties;
    }

    public record AccessState(boolean unlocked, int points, int unlockPoints) {
    }

    public int unlockPoints() {
        return properties.getMatching().getUnlockPoints();
    }

    /** Read-only view for DTOs: no stamping, safe inside read-only transactions. */
    @Transactional(readOnly = true)
    public AccessState state(UUID userId) {
        UserTaskStats stats = userTaskStatsRepository.findByUserId(userId).orElse(null);
        int points = stats == null ? 0 : stats.getTotalPoints();
        boolean unlocked = (stats != null && stats.getMatchingUnlockedAt() != null)
            || points >= unlockPoints()
            || matchMemberRepository.existsByUserId(userId);
        return new AccessState(unlocked, points, unlockPoints());
    }

    /** Throws {@code matching_locked} unless the user may match. Stamps the unlock when it's new. */
    @Transactional
    public void requireUnlocked(User user) {
        AccessState state = refresh(user, false);
        if (!state.unlocked()) {
            throw new MatchingLockedException(
                "Peer matching unlocks at %,d points. You're at %,d. Keep doing your daily tasks."
                    .formatted(state.unlockPoints(), state.points()));
        }
    }

    /**
     * Re-evaluates the lock and stamps {@code matchingUnlockedAt} the first time
     * it opens. With {@code announce}, a fresh unlock also notifies the student —
     * used right after an admin approval pushes them over the line.
     */
    @Transactional
    public AccessState refresh(User user, boolean announce) {
        AccessState state = state(user.getId());
        if (!state.unlocked()) {
            return state;
        }
        UserTaskStats stats = userTaskStatsRepository.findByUserId(user.getId()).orElseGet(() -> new UserTaskStats(user));
        if (stats.getMatchingUnlockedAt() == null) {
            stats.setMatchingUnlockedAt(Instant.now());
            userTaskStatsRepository.save(stats);
            if (announce) {
                notificationService.notifyUser(
                    user,
                    NotificationType.MATCHING_UNLOCKED,
                    "Matching is unlocked",
                    "You reached " + state.unlockPoints() + " points. Find your people on the Matches tab.",
                    Map.of("points", state.points())
                );
            }
        }
        return state;
    }
}
