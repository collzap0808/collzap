package collzap.backend.service;

import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import collzap.backend.dto.InterestDtos.CampusInterestCount;
import collzap.backend.dto.InterestDtos.InterestCatalogResponse;
import collzap.backend.dto.InterestDtos.InterestFeedbackRequest;
import collzap.backend.dto.InterestDtos.InterestResponse;
import collzap.backend.dto.InterestDtos.InterestSelectionItem;
import collzap.backend.dto.InterestDtos.ProjectTypesResponse;
import collzap.backend.dto.InterestDtos.SelectConnectionTypeRequest;
import collzap.backend.dto.InterestDtos.SelectInterestsRequest;
import collzap.backend.dto.InterestDtos.SelectProjectTypesRequest;
import collzap.backend.dto.InterestDtos.SetShortTermInterestRequest;
import collzap.backend.dto.InterestDtos.UserInterestResponse;
import collzap.backend.dto.UserDtos.ConnectionTypeSelectionResponse;
import collzap.backend.enums.ConnectionType;
import collzap.backend.enums.InterestCategory;
import collzap.backend.enums.ProjectType;
import collzap.backend.enums.SeriousnessLevel;
import collzap.backend.exception.BadRequestException;
import collzap.backend.exception.ConflictException;
import collzap.backend.exception.NotFoundException;
import collzap.backend.models.ConnectionTypeSelection;
import collzap.backend.models.Interest;
import collzap.backend.models.InterestFeedback;
import collzap.backend.models.SeriousnessTestAttempt;
import collzap.backend.models.User;
import collzap.backend.models.UserInterestSelection;
import collzap.backend.models.UserProjectTypeSelection;
import collzap.backend.repositories.ConnectionTypeSelectionRepository;
import collzap.backend.repositories.InterestFeedbackRepository;
import collzap.backend.repositories.InterestRepository;
import collzap.backend.repositories.UserInterestSelectionRepository;
import collzap.backend.repositories.UserProjectTypeSelectionRepository;

/**
 * Project type, interest and connection type choices. All three are persistent
 * and re-selectable, so each setter replaces the previous choice for the scope it
 * covers rather than appending to it.
 */
@Service
public class InterestService {

    private final InterestRepository interestRepository;
    private final UserInterestSelectionRepository selectionRepository;
    private final UserProjectTypeSelectionRepository projectTypeRepository;
    private final ConnectionTypeSelectionRepository connectionTypeRepository;
    private final InterestFeedbackRepository feedbackRepository;
    private final UserService userService;
    private final SeriousnessLevelLookup levelLookup;

    public InterestService(
        InterestRepository interestRepository,
        UserInterestSelectionRepository selectionRepository,
        UserProjectTypeSelectionRepository projectTypeRepository,
        ConnectionTypeSelectionRepository connectionTypeRepository,
        InterestFeedbackRepository feedbackRepository,
        UserService userService,
        SeriousnessLevelLookup levelLookup
    ) {
        this.interestRepository = interestRepository;
        this.selectionRepository = selectionRepository;
        this.projectTypeRepository = projectTypeRepository;
        this.connectionTypeRepository = connectionTypeRepository;
        this.feedbackRepository = feedbackRepository;
        this.userService = userService;
        this.levelLookup = levelLookup;
    }

    @Cacheable("interestCatalog")
    @Transactional(readOnly = true)
    public InterestCatalogResponse catalog() {
        return new InterestCatalogResponse(
            interestRepository.findByCategoryAndActiveTrueOrderByDisplayOrderAsc(InterestCategory.LONG_TERM)
                .stream().map(InterestService::toResponse).toList(),
            interestRepository.findByCategoryAndActiveTrueOrderByDisplayOrderAsc(InterestCategory.SHORT_TERM)
                .stream().map(InterestService::toResponse).toList(),
            ProjectType.LONG_TERM.maxInterestSelections(),
            ProjectType.SHORT_TERM.maxInterestSelections()
        );
    }

    @Transactional(readOnly = true)
    public ProjectTypesResponse projectTypes(UUID userId) {
        return new ProjectTypesResponse(currentProjectTypes(userId));
    }

    /**
     * Both modes can be on at once. Turning a mode off drops the interests and the
     * connection type that belonged to it, so nothing is left dangling.
     */
    @Transactional
    public ProjectTypesResponse selectProjectTypes(UUID userId, SelectProjectTypesRequest request) {
        User user = userService.requireSelf(userId);
        Set<ProjectType> requested = EnumSet.copyOf(request.projectTypes());

        List<UserProjectTypeSelection> existing = projectTypeRepository.findByUserId(userId);
        boolean hadLongTerm = existing.stream()
            .anyMatch(selection -> selection.getProjectType() == ProjectType.LONG_TERM);
        if (hadLongTerm && !requested.contains(ProjectType.LONG_TERM)) {
            throw new ConflictException("Long-term matching is set once and can't be removed");
        }

        for (UserProjectTypeSelection selection : existing) {
            if (!requested.contains(selection.getProjectType())) {
                selectionRepository.deleteByUserIdAndProjectType(userId, selection.getProjectType());
                connectionTypeRepository
                    .findByUserIdAndProjectType(userId, selection.getProjectType())
                    .ifPresent(connectionTypeRepository::delete);
                projectTypeRepository.delete(selection);
            }
        }
        Set<ProjectType> alreadyStored = existing.stream()
            .map(UserProjectTypeSelection::getProjectType)
            .filter(requested::contains)
            .collect(java.util.stream.Collectors.toCollection(() -> EnumSet.noneOf(ProjectType.class)));

        for (ProjectType projectType : requested) {
            if (!alreadyStored.contains(projectType)) {
                projectTypeRepository.save(new UserProjectTypeSelection(user, projectType));
            }
        }
        return new ProjectTypesResponse(requested);
    }

    /**
     * What other verified students on the caller's campus are into — counts
     * only, never names, so it can't be used to browse people.
     */
    @Transactional(readOnly = true)
    public List<CampusInterestCount> campusCounts(UUID userId) {
        var user = userService.requireSelf(userId);
        if (user.getCollege() == null) {
            return List.of();
        }
        return selectionRepository.countCampusStudentsByInterest(user.getCollege().getId(), userId).stream()
            .map(r -> new CampusInterestCount((UUID) r[0], (String) r[1], (InterestCategory) r[2], (Long) r[3]))
            .toList();
    }

    @Transactional(readOnly = true)
    public List<UserInterestResponse> interests(UUID userId) {
        Map<UUID, SeriousnessTestAttempt> attempts = levelLookup.latestByInterest(userId);
        return selectionRepository.findAllWithInterestByUserId(userId).stream()
            .map(selection -> toUserInterest(selection, attempts))
            .toList();
    }

    /**
     * Replaces the selection for one project type. Long-Term takes at most two
     * interests and Short-Term exactly one, and each list may only draw from its own
     * catalogue.
     */
    @Transactional
    public List<UserInterestResponse> selectInterests(UUID userId, SelectInterestsRequest request) {
        User user = userService.requireSelf(userId);
        ProjectType projectType = request.projectType();

        if (!projectTypeRepository.existsByUserIdAndProjectType(userId, projectType)) {
            throw new BadRequestException(
                "Select %s as a project type before choosing its interests"
                    .formatted(label(projectType)));
        }
        if (projectType == ProjectType.LONG_TERM
            && selectionRepository.countByUserIdAndProjectType(userId, ProjectType.LONG_TERM) > 0) {
            throw new ConflictException("Long-term interests are set once and can't be changed");
        }

        int max = projectType.maxInterestSelections();
        List<InterestSelectionItem> items = request.selections();
        if (items.size() > max) {
            throw new BadRequestException(
                max == 1
                    ? "Pick one %s activity".formatted(label(projectType))
                    : "Pick at most %d %s interests".formatted(max, label(projectType)));
        }
        Set<UUID> distinct = new HashSet<>();
        for (InterestSelectionItem item : items) {
            if (!distinct.add(item.interestId())) {
                throw new BadRequestException("The same interest was selected twice");
            }
        }

        InterestCategory expected = InterestCategory.of(projectType);
        List<UserInterestSelection> replacements = new ArrayList<>(items.size());
        for (InterestSelectionItem item : items) {
            Interest interest = interestRepository.findById(item.interestId())
                .orElseThrow(() -> new NotFoundException("Interest not found"));
            if (!interest.isActive()) {
                throw new BadRequestException("%s is no longer available".formatted(interest.getName()));
            }
            if (interest.getCategory() != expected) {
                throw new BadRequestException(
                    "%s is not a %s option".formatted(interest.getName(), label(projectType)));
            }
            replacements.add(new UserInterestSelection(
                user,
                interest,
                projectType,
                UserService.trimToNull(item.subTag())
            ));
        }

        selectionRepository.deleteByUserIdAndProjectType(userId, projectType);
        selectionRepository.flush();
        selectionRepository.saveAll(replacements);

        return interests(userId);
    }

    /**
     * One-shot Short-Term setup or swap, usable at any time (not just onboarding).
     * Unlike {@link #selectProjectTypes} + {@link #selectInterests} as two separate
     * calls, this does everything — enabling the project type on first use,
     * setting the connection type if none exists yet, and replacing the interest —
     * in one transaction, so a caller polling onboarding state never observes a
     * half-done intermediate state between the two writes.
     */
    @Transactional
    public List<UserInterestResponse> setShortTermInterest(UUID userId, SetShortTermInterestRequest request) {
        User user = userService.requireSelf(userId);

        if (!projectTypeRepository.existsByUserIdAndProjectType(userId, ProjectType.SHORT_TERM)) {
            projectTypeRepository.save(new UserProjectTypeSelection(user, ProjectType.SHORT_TERM));
        }

        ConnectionType connectionType = request.connectionType();
        java.util.Optional<ConnectionTypeSelection> existingConnection =
            connectionTypeRepository.findByUserIdAndProjectType(userId, ProjectType.SHORT_TERM);
        if (existingConnection.isEmpty()) {
            if (connectionType == null) {
                throw new BadRequestException("Pick a connection type");
            }
            connectionTypeRepository.save(
                new ConnectionTypeSelection(user, ProjectType.SHORT_TERM, connectionType));
        } else if (connectionType != null) {
            existingConnection.get().setConnectionType(connectionType);
            connectionTypeRepository.save(existingConnection.get());
        }

        Interest interest = interestRepository.findById(request.interestId())
            .orElseThrow(() -> new NotFoundException("Interest not found"));
        if (!interest.isActive()) {
            throw new BadRequestException("%s is no longer available".formatted(interest.getName()));
        }
        if (interest.getCategory() != InterestCategory.SHORT_TERM) {
            throw new BadRequestException("%s is not a Short-Term option".formatted(interest.getName()));
        }

        selectionRepository.deleteByUserIdAndProjectType(userId, ProjectType.SHORT_TERM);
        selectionRepository.flush();
        selectionRepository.save(new UserInterestSelection(
            user, interest, ProjectType.SHORT_TERM, UserService.trimToNull(request.subTag())));

        return interests(userId);
    }

    @Transactional(readOnly = true)
    public List<ConnectionTypeSelectionResponse> connectionTypes(UUID userId) {
        return connectionTypeRepository.findByUserId(userId).stream()
            .map(selection -> new ConnectionTypeSelectionResponse(
                selection.getProjectType(), selection.getConnectionType()))
            .toList();
    }

    /**
     * One connection type per project type, applied to every interest in that mode.
     * Society is Long-Term only.
     */
    @Transactional
    public ConnectionTypeSelectionResponse selectConnectionType(UUID userId, SelectConnectionTypeRequest request) {
        User user = userService.requireSelf(userId);
        ProjectType projectType = request.projectType();

        if (!projectTypeRepository.existsByUserIdAndProjectType(userId, projectType)) {
            throw new BadRequestException(
                "Select %s as a project type first".formatted(label(projectType)));
        }
        if (projectType == ProjectType.LONG_TERM
            && connectionTypeRepository.findByUserIdAndProjectType(userId, ProjectType.LONG_TERM).isPresent()) {
            throw new ConflictException("Long-term matching is set once and can't be changed");
        }
        if (!request.connectionType().isAvailableFor(projectType)) {
            throw new BadRequestException(
                "%s is not available for %s".formatted(request.connectionType(), label(projectType)));
        }

        ConnectionTypeSelection selection = connectionTypeRepository
            .findByUserIdAndProjectType(userId, projectType)
            .orElseGet(() -> new ConnectionTypeSelection(user, projectType, request.connectionType()));
        selection.setConnectionType(request.connectionType());
        connectionTypeRepository.save(selection);

        return new ConnectionTypeSelectionResponse(projectType, selection.getConnectionType());
    }

    /** The "can't find your interest?" link on the selection screen. */
    @Transactional
    public void submitFeedback(UUID userId, InterestFeedbackRequest request) {
        User user = userService.requireSelf(userId);
        feedbackRepository.save(new InterestFeedback(
            user,
            request.projectType(),
            request.suggestion().trim()
        ));
    }

    @Transactional(readOnly = true)
    public Set<ProjectType> currentProjectTypes(UUID userId) {
        Set<ProjectType> types = EnumSet.noneOf(ProjectType.class);
        projectTypeRepository.findByUserId(userId)
            .forEach(selection -> types.add(selection.getProjectType()));
        return types;
    }

    private static UserInterestResponse toUserInterest(
        UserInterestSelection selection,
        Map<UUID, SeriousnessTestAttempt> attempts
    ) {
        Interest interest = selection.getInterest();
        SeriousnessTestAttempt attempt = attempts.get(interest.getId());
        SeriousnessLevel level = attempt == null ? null : attempt.getLevel();
        Integer score = attempt == null ? null : attempt.getScore();
        return new UserInterestResponse(
            interest.getId(),
            interest.getName(),
            interest.getCategory(),
            selection.getProjectType(),
            selection.getSubTag(),
            level,
            score
        );
    }

    static String label(ProjectType projectType) {
        return projectType == ProjectType.LONG_TERM ? "Long-Term Peer" : "Short-Term Buddy";
    }

    public static InterestResponse toResponse(Interest interest) {
        return new InterestResponse(
            interest.getId(),
            interest.getName(),
            interest.getCategory(),
            interest.getDisplayOrder()
        );
    }
}
