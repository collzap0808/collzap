package collzap.backend.models;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One row per user, across every group and interest — points and a streak
 * only, no leaderboard and no effect on matching or verification. The streak
 * extends at most once per IST calendar day no matter how many tasks or
 * reviews happen that day, and resets to 1 after any gap.
 */
@Entity
@Table(name = "user_task_stats")
@Getter
@Setter
@NoArgsConstructor
public class UserTaskStats extends BaseEntity {

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "total_points", nullable = false)
    private int totalPoints = 0;

    @Column(name = "current_streak_days", nullable = false)
    private int currentStreakDays = 0;

    @Column(name = "longest_streak_days", nullable = false)
    private int longestStreakDays = 0;

    @Column(name = "last_activity_date")
    private LocalDate lastActivityDate;

    /** When peer matching opened for this user. Set once, never cleared. */
    @Column(name = "matching_unlocked_at")
    private Instant matchingUnlockedAt;

    public UserTaskStats(User user) {
        this.user = user;
    }
}
