package collzap.backend.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import collzap.backend.enums.ConnectionType;
import collzap.backend.enums.DocumentType;
import collzap.backend.enums.MatchGroupStatus;
import collzap.backend.enums.ProjectType;
import collzap.backend.enums.SeriousnessLevel;
import collzap.backend.enums.Status;
import collzap.backend.enums.VerificationStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class AdminDtos {

    private AdminDtos() {
    }

    public record AdminStatsResponse(
        long totalUsers,
        long verifiedUsers,
        long pendingVerifications,
        long activeMatchGroups,
        long waitingMatchGroups,
        long totalMessages
    ) {
    }

    /** A reason is mandatory — this is a hard delete, not a soft ban, and it's logged. */
    public record DeleteUserRequest(
        @NotBlank(message = "A reason is required")
        @Size(max = 500, message = "Keep it under 500 characters")
        String reason
    ) {
    }

    public record AdminUserRow(
        UUID id,
        String name,
        String email,
        String collegeName,
        VerificationStatus verificationStatus,
        Status accountStatus,
        boolean profileCompleted,
        Instant createdAt
    ) {
    }

    public record PendingVerificationRow(
        UUID documentId,
        UUID userId,
        String userName,
        String email,
        String collegeName,
        DocumentType documentType,
        String documentUrl,
        Instant uploadedAt
    ) {
    }

    public record AdminMatchRow(
        UUID matchGroupId,
        String interestName,
        String collegeName,
        ProjectType projectType,
        ConnectionType connectionType,
        MatchGroupStatus status,
        SeriousnessLevel levelBand,
        int memberCount,
        int maxMembers,
        List<String> memberNames,
        Instant createdAt,
        Instant openedAt
    ) {
    }

    /** Waiting queue view, with how long the group has been sitting there. */
    public record AdminQueueRow(
        UUID matchGroupId,
        String interestName,
        String collegeName,
        ProjectType projectType,
        ConnectionType connectionType,
        SeriousnessLevel levelBand,
        Instant waitingSince,
        long waitedSeconds,
        List<String> memberNames
    ) {
    }

    public record CreateMatchRequest(
        @NotEmpty(message = "Pick at least two users to match")
        @Size(min = 2, max = 4, message = "A manual match takes 2 to 4 users")
        List<UUID> userIds,

        @NotNull(message = "Interest is required")
        UUID interestId,

        @NotNull(message = "Connection type is required")
        ConnectionType connectionType,

        @NotNull(message = "Project type is required")
        ProjectType projectType
    ) {
    }

    public record UnmatchRequest(
        @NotNull(message = "Match group is required")
        UUID matchGroupId,

        /** Remove a single member; omit to dissolve the whole group. */
        UUID userId
    ) {
    }

    public record AdminReportRow(
        UUID id,
        UUID reporterId,
        String reporterName,
        UUID reportedId,
        String reportedName,
        String reason,
        Instant createdAt
    ) {
    }

    public record InterestFeedbackRow(
        UUID id,
        UUID userId,
        String userName,
        ProjectType projectType,
        String suggestion,
        Instant createdAt
    ) {
    }

    /** One MCQ option carrying its own point value — used both to author and to read back a question. */
    public record QuestionOptionDto(
        @NotBlank(message = "Option text is required")
        String text,

        @Min(value = 0, message = "Points cannot be negative")
        int points
    ) {
    }

    public record QuestionRequest(
        @NotBlank(message = "Question text is required")
        String questionText,

        @NotEmpty(message = "Exactly 4 options required")
        @Size(min = 4, max = 4, message = "Exactly 4 options required")
        @Valid
        List<QuestionOptionDto> options,

        @NotNull(message = "Interest ID required")
        UUID interestId
    ) {
    }

    public record AdminQuestionResponse(
        UUID id,
        String questionText,
        List<QuestionOptionDto> options,
        UUID interestId,
        String interestName
    ) {
    }

    /** One day of landing-page traffic from Google Analytics; {@code date} is yyyy-MM-dd. */
    public record LandingVisitDay(String date, long visitors, long newVisitors, long pageViews) {
    }

    /**
     * {@code visitors} in the totals is unique across the whole range, so it is
     * lower than the sum of the daily figures when people come back.
     */
    public record LandingAnalyticsResponse(
        boolean configured,
        int days,
        long visitors,
        long newVisitors,
        long pageViews,
        List<LandingVisitDay> daily
    ) {
    }
}
