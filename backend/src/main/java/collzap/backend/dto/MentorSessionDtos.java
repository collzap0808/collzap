package collzap.backend.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Mentoring sessions: the student view, and admin create/update. */
public final class MentorSessionDtos {

    private MentorSessionDtos() {
    }

    /**
     * {@code status} is AVAILABLE (has a video and its time has passed) or
     * UPCOMING. {@code youtubeVideoId} is withheld from students while upcoming.
     */
    public record SessionResponse(
        UUID id,
        UUID interestId,
        String interestName,
        String title,
        String speakerName,
        String speakerRole,
        String youtubeVideoId,
        Instant scheduledAt,
        int durationMinutes,
        int points,
        String status,
        long watchCount,
        boolean started,
        boolean watched
    ) {
    }

    /** {@code featured} is the newest available session the caller hasn't watched, else the newest available one. */
    public record SessionListResponse(
        SessionResponse featured,
        List<SessionResponse> available,
        List<SessionResponse> upcoming
    ) {
    }

    public record CompleteSessionResponse(int pointsAwarded, boolean alreadyWatched, SessionResponse session) {
    }

    /** {@code youtubeUrl} is optional — leave it blank to schedule an upcoming session and attach the video later. */
    public record SaveSessionRequest(
        @NotNull
        UUID interestId,

        @NotBlank @Size(max = 200)
        String title,

        @Size(max = 120)
        String speakerName,

        @Size(max = 160)
        String speakerRole,

        @Size(max = 500)
        String youtubeUrl,

        @NotNull
        Instant scheduledAt,

        @Min(1) @Max(600)
        int durationMinutes,

        @Min(0) @Max(1000)
        int points
    ) {
    }
}
