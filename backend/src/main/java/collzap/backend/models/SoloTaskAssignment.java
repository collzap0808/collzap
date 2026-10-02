package collzap.backend.models;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One day's solo task as it landed for one student. The unique (progress, day)
 * constraint is the backstop against handing out the same day twice, exactly as
 * {@link TaskAssignment}'s is for groups.
 */
@Entity
@Table(
    name = "solo_task_assignments",
    uniqueConstraints = @UniqueConstraint(name = "uk_solo_assignment_progress_day", columnNames = {"solo_task_progress_id", "day_index"}),
    indexes = @Index(name = "idx_solo_assignments_user_id", columnList = "user_id")
)
@Getter
@Setter
@NoArgsConstructor
public class SoloTaskAssignment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "solo_task_progress_id", nullable = false)
    private SoloTaskProgress progress;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "task_bank_item_id", nullable = false)
    private TaskBankItem taskBankItem;

    @Column(name = "day_index", nullable = false)
    private int dayIndex;

    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    public SoloTaskAssignment(SoloTaskProgress progress, User user, TaskBankItem taskBankItem, int dayIndex, Instant assignedAt) {
        this.progress = progress;
        this.user = user;
        this.taskBankItem = taskBankItem;
        this.dayIndex = dayIndex;
        this.assignedAt = assignedAt;
    }
}
