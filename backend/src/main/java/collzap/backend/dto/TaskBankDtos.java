package collzap.backend.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import collzap.backend.enums.TaskTrack;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Admin upload of a daily task sequence. The frontend is responsible for the
 * type-filtering rule (drop items whose type is exactly "monthly_project") and
 * for renaming the source JSON's loosely-typed fields to these before posting
 * — this DTO only ever sees the already-mapped shape, so the backend has one
 * simple, strict contract regardless of how a future source document is worded.
 */
public final class TaskBankDtos {

    private TaskBankDtos() {
    }

    public record DailyTaskItemDto(
        @Min(value = 1, message = "Day must be 1 or greater")
        int dayIndex,

        @NotBlank(message = "Every task needs a title")
        @Size(max = 200)
        String title,

        @Size(max = 500)
        String learnResource,

        @NotBlank(message = "Every task needs a description")
        @Size(max = 2000)
        String description,

        @Size(max = 1000)
        String submissionInstructions,

        @Min(value = 0, message = "Points cannot be negative")
        int points,

        @Size(max = 60)
        String durationLabel
    ) {
    }

    public record UploadTaskBankRequest(
        @NotNull(message = "Pick an interest")
        UUID interestId,

        @NotBlank(message = "Give this bank a title")
        @Size(max = 200)
        String title,

        @NotEmpty(message = "At least one day of tasks is required")
        @Valid
        List<DailyTaskItemDto> tasks,
        /** GROUP (matched groups, peer-reviewed) or SOLO (pre-match, admin-reviewed). Defaults to GROUP. */
        TaskTrack track
    ) {
    }

    public record TaskBankResponse(
        UUID id,
        UUID interestId,
        String interestName,
        String title,
        boolean active,
        int itemCount,
        Instant createdAt,
        TaskTrack track
    ) {
    }

    public record TaskBankItemResponse(
        UUID id,
        int dayIndex,
        String title,
        String learnResource,
        String description,
        String submissionInstructions,
        int points,
        String durationLabel
    ) {
    }
}
