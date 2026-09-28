package collzap.backend.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

/** Student-facing: today's task, submitting it, and reviewing a peer's submission. */
public final class TaskDtos {

    private TaskDtos() {
    }

    public record SubmitTaskRequest(
        @Size(max = 4000)
        String contentText,

        @Size(max = 1000)
        String linkUrl,

        @Size(max = 1000)
        String fileUrl
    ) {
    }

    public record ReviewSubmissionRequest(
        @Min(1) @Max(5) int completionScore,
        @Min(1) @Max(5) int qualityScore,
        @Min(1) @Max(5) int learningScore,
        @Min(1) @Max(5) int effortScore,

        @Size(max = 1000)
        String feedbackText
    ) {
    }

    public record TaskAssignmentResponse(
        UUID id,
        int dayIndex,
        String title,
        String learnResource,
        String description,
        String submissionInstructions,
        int points,
        String durationLabel,
        Instant assignedAt
    ) {
    }

    public record ReviewResponse(
        UUID id,
        UUID reviewerId,
        String reviewerName,
        int completionScore,
        int qualityScore,
        int learningScore,
        int effortScore,
        String feedbackText,
        Instant reviewedAt
    ) {
    }

    public record SubmissionResponse(
        UUID id,
        UUID userId,
        String userName,
        String userPhotoUrl,
        String contentText,
        String linkUrl,
        String fileUrl,
        Instant submittedAt,
        boolean mine,
        boolean reviewedByMe,
        List<ReviewResponse> reviews
    ) {
    }

    /**
     * {@code assignment} is null once the group's bank is exhausted, or before
     * the group's first tick — {@code bankCompleted} tells the client which of
     * those it is, since the empty state reads very differently ("all done!"
     * versus "nothing yet, check back tomorrow").
     */
    public record TodaysTaskResponse(
        TaskAssignmentResponse assignment,
        boolean bankCompleted,
        List<SubmissionResponse> submissions
    ) {
    }

    /** {@code month} is "YYYY-MM"; {@code days} lists only IST days with at least one submission. */
    public record TaskCalendarResponse(String month, List<DayCount> days) {
        public record DayCount(LocalDate date, int submissions) {
        }
    }

    public record UserTaskStatsResponse(
        int totalPoints,
        int currentStreakDays,
        int longestStreakDays,
        int tasksDone,
        int reviewsGiven,
        int sessionsWatched,
        List<ActivityItem> recentActivity
    ) {
    }

    /** {@code kind} is TASK (a submission), REVIEW (a review the user gave) or SESSION (a mentoring session watched). */
    public record ActivityItem(String kind, String title, int points, Instant at) {
    }
}
