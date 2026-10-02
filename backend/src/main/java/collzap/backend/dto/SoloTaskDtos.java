package collzap.backend.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import collzap.backend.enums.SoloReviewStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Solo daily tasks: what a not-yet-matched student works on, and the admin review of it. */
public final class SoloTaskDtos {

    private SoloTaskDtos() {
    }

    public record SoloSubmissionView(
        UUID id,
        String contentText,
        String linkUrl,
        String fileUrl,
        Instant submittedAt,
        SoloReviewStatus status,
        Integer completionScore,
        Integer qualityScore,
        Integer learningScore,
        Integer effortScore,
        String feedbackText,
        Instant reviewedAt,
        int pointsAwarded
    ) {
    }

    public record SoloTaskItem(
        UUID assignmentId,
        UUID interestId,
        String interestName,
        int dayIndex,
        String title,
        String learnResource,
        String description,
        String submissionInstructions,
        int points,
        String durationLabel,
        Instant assignedAt,
        SoloSubmissionView submission
    ) {
    }

    /**
     * @param locked        peer matching still locked (solo tasks are the way in)
     * @param points        the student's total points
     * @param unlockPoints  points at which matching opens
     * @param tasks         the current task for each interest that has a task bank
     * @param emptyReason   why {@code tasks} is empty, else null: NOT_VERIFIED,
     *                      NO_INTERESTS, NO_BANK (no active bank for any of the
     *                      student's interests) or ALL_DONE (every bank finished)
     */
    public record SoloTasksResponse(boolean locked, int points, int unlockPoints, List<SoloTaskItem> tasks, String emptyReason) {
    }

    public record AdminSoloSubmissionRow(
        UUID id,
        UUID userId,
        String userName,
        String userEmail,
        String collegeName,
        String interestName,
        int dayIndex,
        String taskTitle,
        String taskDescription,
        String submissionInstructions,
        int taskPoints,
        String contentText,
        String linkUrl,
        String fileUrl,
        Instant submittedAt,
        SoloReviewStatus status,
        Integer completionScore,
        Integer qualityScore,
        Integer learningScore,
        Integer effortScore,
        String feedbackText,
        Instant reviewedAt,
        int pointsAwarded,
        String reviewedBy
    ) {
    }

    /** Approve with the four 1–5 scores, or request changes with feedback. */
    public record AdminSoloReviewRequest(
        @NotNull(message = "Choose approve or request changes")
        Boolean approve,
        @Min(1) @Max(5) Integer completionScore,
        @Min(1) @Max(5) Integer qualityScore,
        @Min(1) @Max(5) Integer learningScore,
        @Min(1) @Max(5) Integer effortScore,
        @Size(max = 2000, message = "Keep feedback under 2000 characters")
        String feedbackText
    ) {
    }

    public record PendingCountResponse(long pending) {
    }
}
