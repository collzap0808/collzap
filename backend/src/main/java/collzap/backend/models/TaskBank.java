package collzap.backend.models;

import collzap.backend.enums.TaskTrack;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A sequence of daily tasks for one interest, uploaded by an admin as JSON.
 * Immutable once created: replacing a bank means uploading a new one and
 * deactivating this one, never editing it in place. That is what lets a bank
 * change without shifting the day-mapping of a {@link GroupTaskProgress} that
 * is already mid-sequence and has this exact bank pinned.
 */
@Entity
@Table(
    name = "task_banks",
    indexes = {
        @Index(name = "idx_task_banks_interest_id", columnList = "interest_id"),
        @Index(name = "idx_task_banks_interest_active", columnList = "interest_id, active")
    }
)
@Getter
@Setter
@NoArgsConstructor
public class TaskBank extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "interest_id", nullable = false)
    private Interest interest;

    @Column(name = "title", nullable = false)
    private String title;

    /** At most one active bank per interest at a time — enforced in the service, not the schema. */
    @Column(name = "active", nullable = false)
    private boolean active = true;

    /**
     * Nullable on purpose: banks created before solo tasks existed have no value,
     * and adding a NOT NULL column to a populated table would fail under
     * ddl-auto=update. Null reads as GROUP — see {@link #track()}.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "track", length = 16)
    private TaskTrack track;

    public TaskTrack track() {
        return track == null ? TaskTrack.GROUP : track;
    }

    public TaskBank(Interest interest, String title) {
        this.interest = interest;
        this.title = title;
    }
}
