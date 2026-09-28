package collzap.backend.models;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A mentoring session for one interest — a recorded YouTube talk students
 * watch for points. It is "upcoming" until it has a video and its scheduled
 * time has passed; that status is derived, never stored, so an admin can
 * schedule a session first and attach the video later.
 */
@Entity
@Table(
    name = "mentor_sessions",
    indexes = @Index(name = "idx_mentor_sessions_interest_time", columnList = "interest_id, scheduled_at")
)
@Getter
@Setter
@NoArgsConstructor
public class MentorSession extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "interest_id", nullable = false)
    private Interest interest;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "speaker_name", length = 120)
    private String speakerName;

    @Column(name = "speaker_role", length = 160)
    private String speakerRole;

    @Column(name = "youtube_video_id", length = 20)
    private String youtubeVideoId;

    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Column(name = "points", nullable = false)
    private int points = 30;

    public boolean isAvailable(Instant now) {
        return youtubeVideoId != null && !scheduledAt.isAfter(now);
    }
}
