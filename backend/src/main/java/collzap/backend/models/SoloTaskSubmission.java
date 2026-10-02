package collzap.backend.models;

import java.time.Instant;

import collzap.backend.enums.SoloReviewStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * A student's work on a solo task, and an admin's review of it. One row per
 * assignment: "request changes" sends the row back to the student, and their
 * resubmission overwrites the content and returns it to PENDING.
 *
 * <p>Points are credited only on approval ({@link #pointsAwarded}), unlike group
 * tasks, so empty submissions can't be used to climb to the matching unlock.
 */
@Entity
@Table(
    name = "solo_task_submissions",
    uniqueConstraints = @UniqueConstraint(name = "uk_solo_submission_assignment", columnNames = {"solo_task_assignment_id"}),
    indexes = {
        @Index(name = "idx_solo_submissions_status", columnList = "status"),
        @Index(name = "idx_solo_submissions_user_id", columnList = "user_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
public class SoloTaskSubmission extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "solo_task_assignment_id", nullable = false)
    private SoloTaskAssignment assignment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "content_text", columnDefinition = "text")
    private String contentText;

    @Column(name = "link_url", length = 1000)
    private String linkUrl;

    @Column(name = "file_url", length = 1000)
    private String fileUrl;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 24)
    private SoloReviewStatus status = SoloReviewStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_admin_id")
    private AdminUser reviewedBy;

    @Column(name = "completion_score")
    private Integer completionScore;

    @Column(name = "quality_score")
    private Integer qualityScore;

    @Column(name = "learning_score")
    private Integer learningScore;

    @Column(name = "effort_score")
    private Integer effortScore;

    @Column(name = "feedback_text", columnDefinition = "text")
    private String feedbackText;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "points_awarded", nullable = false)
    private int pointsAwarded = 0;

    public SoloTaskSubmission(SoloTaskAssignment assignment, User user) {
        this.assignment = assignment;
        this.user = user;
    }
}
