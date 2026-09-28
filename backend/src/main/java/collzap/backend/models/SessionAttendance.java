package collzap.backend.models;

import java.time.Instant;

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
 * One student's viewing of one session. {@code startedAt} is recorded on first
 * play; {@code completedAt} only once enough real time has passed, which is
 * what stops points being claimed without actually watching.
 */
@Entity
@Table(
    name = "session_attendances",
    uniqueConstraints = @UniqueConstraint(name = "uk_attendance_session_user", columnNames = {"session_id", "user_id"})
)
@Getter
@Setter
@NoArgsConstructor
public class SessionAttendance extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private MentorSession session;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "points_awarded", nullable = false)
    private int pointsAwarded = 0;

    public SessionAttendance(MentorSession session, User user, Instant startedAt) {
        this.session = session;
        this.user = user;
        this.startedAt = startedAt;
    }
}
