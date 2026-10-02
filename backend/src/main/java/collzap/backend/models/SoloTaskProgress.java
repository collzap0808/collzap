package collzap.backend.models;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One student's own clock through an interest's SOLO task bank, the solo
 * counterpart of {@link GroupTaskProgress}. Day 1 is whenever the student first
 * opened their tasks; the bank is pinned at creation, like a group's.
 */
@Entity
@Table(
    name = "solo_task_progress",
    uniqueConstraints = @UniqueConstraint(name = "uk_solo_progress_user_interest", columnNames = {"user_id", "interest_id"})
)
@Getter
@Setter
@NoArgsConstructor
public class SoloTaskProgress extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "interest_id", nullable = false)
    private Interest interest;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "task_bank_id", nullable = false)
    private TaskBank taskBank;

    /** 0 means no day has been assigned yet. */
    @Column(name = "current_day_index", nullable = false)
    private int currentDayIndex = 0;

    /** IST date of the last assignment, so a day is handed out at most once per day. */
    @Column(name = "last_assigned_date")
    private LocalDate lastAssignedDate;

    /** Set when the bank runs out of days. No wraparound. */
    @Column(name = "completed_at")
    private Instant completedAt;

    public SoloTaskProgress(User user, Interest interest, TaskBank taskBank) {
        this.user = user;
        this.interest = interest;
        this.taskBank = taskBank;
    }
}
