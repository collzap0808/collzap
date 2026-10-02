package collzap.backend.dto;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import collzap.backend.enums.ConnectionType;
import collzap.backend.enums.OnboardingStep;
import collzap.backend.enums.ProjectType;
import collzap.backend.enums.SeriousnessLevel;
import collzap.backend.enums.Status;
import collzap.backend.enums.VerificationStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class UserDtos {

    private UserDtos() {
    }

    public record UserResponse(
        UUID id,
        String email,
        String name,
        UUID collegeId,
        String collegeName,
        String profilePhotoUrl,
        Integer yearOfStudy,
        String city,
        String course,
        String storyPrompt1,
        String storyPrompt2,
        String storyPrompt3,
        String proofOfWorkUrl,
        VerificationStatus verificationStatus,
        String rejectionReason,
        boolean profileCompleted,
        int profileCompletionPercent,
        boolean notificationsEnabled,
        boolean profileVisible,
        Status accountStatus,
        Instant createdAt
    ) {
    }

    /**
     * Profile setup and edit both post this. Name and college are mandatory; the
     * proof-of-work link stays optional.
     */
    public record UpdateProfileRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 120, message = "Name must be at most 120 characters")
        String name,

        @NotNull(message = "College is required")
        UUID collegeId,

        @Size(max = 1000)
        String profilePhotoUrl,

        @Min(value = 1, message = "Year of study must be between 1 and 6")
        @Max(value = 6, message = "Year of study must be between 1 and 6")
        Integer yearOfStudy,

        @Size(max = 120)
        String city,

        @Size(max = 120)
        String course,

        @Size(max = 500, message = "Keep it under 500 characters")
        String storyPrompt1,

        @Size(max = 500, message = "Keep it under 500 characters")
        String storyPrompt2,

        @Size(max = 500, message = "Keep it under 500 characters")
        String storyPrompt3,

        @Size(max = 1000)
        String proofOfWorkUrl
    ) {
    }

    /** Client uploads the image itself and sends back the resulting URL. */
    public record UpdatePhotoRequest(
        @NotBlank(message = "Photo URL is required")
        @Size(max = 1000)
        String profilePhotoUrl
    ) {
    }

    /** What another user is allowed to see: no email, respects the visibility flag. */
    public record PeerProfileResponse(
        UUID id,
        String name,
        String profilePhotoUrl,
        String collegeName,
        Integer yearOfStudy,
        String city,
        String course,
        String storyPrompt1,
        String storyPrompt2,
        String storyPrompt3,
        String proofOfWorkUrl,
        List<PeerInterest> interests
    ) {
        public record PeerInterest(String interestName, ProjectType projectType, String subTag, SeriousnessLevel level) {
        }
    }

    public record SettingsResponse(boolean notificationsEnabled, boolean profileVisible) {
    }

    public record UpdateSettingsRequest(Boolean notificationsEnabled, Boolean profileVisible) {
    }

    public record RegisterDeviceRequest(
        @NotBlank(message = "Device token is required")
        @Size(max = 512)
        String token,

        @Size(max = 32)
        String platform
    ) {
    }

    /**
     * Everything the client needs to decide which screen to render, so the app can
     * resume mid-onboarding without probing several endpoints.
     */
    public record OnboardingStateResponse(
        OnboardingStep step,
        VerificationStatus verificationStatus,
        boolean profileCompleted,
        int profileCompletionPercent,
        Set<ProjectType> projectTypes,
        int longTermInterestCount,
        int shortTermInterestCount,
        boolean seriousnessTestCompleted,
        List<ConnectionTypeSelectionResponse> connectionTypes,
        /** Peer matching is open; until then the student does admin-reviewed solo tasks. */
        boolean matchingUnlocked,
        int matchingUnlockPoints
    ) {
    }

    public record ConnectionTypeSelectionResponse(ProjectType projectType, ConnectionType connectionType) {
    }
}
