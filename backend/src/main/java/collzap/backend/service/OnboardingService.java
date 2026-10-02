package collzap.backend.service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import collzap.backend.dto.UserDtos.ConnectionTypeSelectionResponse;
import collzap.backend.dto.UserDtos.OnboardingStateResponse;
import collzap.backend.enums.OnboardingStep;
import collzap.backend.enums.ProjectType;
import collzap.backend.enums.VerificationStatus;
import collzap.backend.models.ConnectionTypeSelection;
import collzap.backend.models.User;
import collzap.backend.models.UserInterestSelection;
import collzap.backend.repositories.ConnectionTypeSelectionRepository;
import collzap.backend.repositories.UserInterestSelectionRepository;
import collzap.backend.repositories.UserProjectTypeSelectionRepository;

/**
 * Works out which screen the app should show next. Verification runs alongside
 * profile setup rather than in front of it — the spec lets a pending user carry
 * on with setup and only gates matching — so the verification checks sit at the
 * end of the chain, not the start.
 */
@Service
public class OnboardingService {

    private final UserProjectTypeSelectionRepository projectTypeRepository;
    private final UserInterestSelectionRepository interestSelectionRepository;
    private final ConnectionTypeSelectionRepository connectionTypeRepository;
    private final UserService userService;
    private final SeriousnessLevelLookup levelLookup;
    private final MatchingAccessService matchingAccessService;

    public OnboardingService(
        UserProjectTypeSelectionRepository projectTypeRepository,
        UserInterestSelectionRepository interestSelectionRepository,
        ConnectionTypeSelectionRepository connectionTypeRepository,
        UserService userService,
        SeriousnessLevelLookup levelLookup,
        MatchingAccessService matchingAccessService
    ) {
        this.matchingAccessService = matchingAccessService;
        this.projectTypeRepository = projectTypeRepository;
        this.interestSelectionRepository = interestSelectionRepository;
        this.connectionTypeRepository = connectionTypeRepository;
        this.userService = userService;
        this.levelLookup = levelLookup;
    }

    /**
     * A missing/deleted user here means the JWT this request came in on no
     * longer maps to a real account (e.g. an admin deleted them mid-session) —
     * {@code requireSelf} surfaces that as 401 so the frontend's existing
     * refresh-then-logout flow cleans it up automatically.
     */
    @Transactional(readOnly = true)
    public OnboardingStateResponse describe(UUID userId) {
        return describe(userService.requireSelf(userId));
    }

    @Transactional(readOnly = true)
    public OnboardingStateResponse describe(User user) {
        UUID userId = user.getId();
        Set<ProjectType> projectTypes = projectTypesOf(userId);
        List<UserInterestSelection> selections = interestSelectionRepository.findAllWithInterestByUserId(userId);
        List<ConnectionTypeSelection> connectionTypes = connectionTypeRepository.findByUserId(userId);

        int longTermCount = (int) selections.stream()
            .filter(s -> s.getProjectType() == ProjectType.LONG_TERM).count();
        int shortTermCount = (int) selections.stream()
            .filter(s -> s.getProjectType() == ProjectType.SHORT_TERM).count();
        MatchingAccessService.AccessState access = matchingAccessService.state(userId);

        return new OnboardingStateResponse(
            resolveStep(user, projectTypes, selections, connectionTypes),
            user.getVerificationStatus(),
            user.isProfileCompleted(),
            user.profileCompletionPercent(),
            projectTypes,
            longTermCount,
            shortTermCount,
            isSeriousnessTestComplete(userId, selections),
            connectionTypes.stream()
                .map(c -> new ConnectionTypeSelectionResponse(c.getProjectType(), c.getConnectionType()))
                .toList(),
            access.unlocked(),
            access.unlockPoints()
        );
    }

    @Transactional(readOnly = true)
    public OnboardingStep nextStep(User user) {
        UUID userId = user.getId();
        return resolveStep(
            user,
            projectTypesOf(userId),
            interestSelectionRepository.findAllWithInterestByUserId(userId),
            connectionTypeRepository.findByUserId(userId)
        );
    }

    /** True once every selected project type has cleared its part of setup. */
    @Transactional(readOnly = true)
    public boolean isReadyToMatch(User user) {
        return nextStep(user) == OnboardingStep.READY;
    }

    private Set<ProjectType> projectTypesOf(UUID userId) {
        return projectTypeRepository.findByUserId(userId).stream()
            .map(selection -> selection.getProjectType())
            .collect(Collectors.toCollection(() -> java.util.EnumSet.noneOf(ProjectType.class)));
    }

    private OnboardingStep resolveStep(
        User user,
        Set<ProjectType> projectTypes,
        List<UserInterestSelection> selections,
        List<ConnectionTypeSelection> connectionTypes
    ) {
        if (!user.isEmailVerified()) {
            return OnboardingStep.VERIFY_EMAIL;
        }
        if (user.getVerificationStatus() == VerificationStatus.REJECTED) {
            return OnboardingStep.VERIFICATION_REJECTED;
        }
        if (user.getVerificationStatus() == VerificationStatus.PENDING) {
            return OnboardingStep.UPLOAD_DOCUMENT;
        }
        if (!user.isProfileCompleted()) {
            return OnboardingStep.COMPLETE_PROFILE;
        }
        if (projectTypes.isEmpty()) {
            return OnboardingStep.SELECT_PROJECT_TYPE;
        }
        for (ProjectType projectType : projectTypes) {
            boolean hasInterest = selections.stream().anyMatch(s -> s.getProjectType() == projectType);
            if (!hasInterest) {
                return OnboardingStep.SELECT_INTERESTS;
            }
        }
        if (projectTypes.contains(ProjectType.LONG_TERM)
            && !isSeriousnessTestComplete(user.getId(), selections)) {
            return OnboardingStep.TAKE_SERIOUSNESS_TEST;
        }
        Set<ProjectType> chosen = connectionTypes.stream()
            .map(ConnectionTypeSelection::getProjectType)
            .collect(Collectors.toSet());
        for (ProjectType projectType : projectTypes) {
            if (!chosen.contains(projectType)) {
                return OnboardingStep.SELECT_CONNECTION_TYPE;
            }
        }
        if (user.getVerificationStatus() != VerificationStatus.APPROVED) {
            return OnboardingStep.AWAITING_VERIFICATION;
        }
        return OnboardingStep.READY;
    }

    /**
     * Short-Term users self-declare, so only the Long-Term interests need a score.
     */
    private boolean isSeriousnessTestComplete(UUID userId, List<UserInterestSelection> selections) {
        List<UUID> longTermInterestIds = selections.stream()
            .filter(s -> s.getProjectType() == ProjectType.LONG_TERM)
            .map(s -> s.getInterest().getId())
            .toList();
        if (longTermInterestIds.isEmpty()) {
            return false;
        }
        Map<UUID, ?> levels = levelLookup.levelsByInterest(userId);
        return levels.keySet().containsAll(longTermInterestIds);
    }
}
