package collzap.backend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import collzap.backend.dto.TaskDtos.TaskAssignmentResponse;
import collzap.backend.enums.MatchGroupStatus;
import collzap.backend.enums.NotificationType;
import collzap.backend.enums.TaskTrack;
import collzap.backend.exception.ForbiddenException;
import collzap.backend.exception.NotFoundException;
import collzap.backend.models.GroupTaskProgress;
import collzap.backend.models.MatchGroup;
import collzap.backend.models.MatchMember;
import collzap.backend.models.TaskAssignment;
import collzap.backend.models.TaskBank;
import collzap.backend.models.TaskBankItem;
import collzap.backend.models.User;
import collzap.backend.repositories.GroupTaskProgressRepository;
import collzap.backend.repositories.MatchGroupRepository;
import collzap.backend.repositories.MatchMemberRepository;
import collzap.backend.repositories.TaskAssignmentRepository;
import collzap.backend.repositories.TaskBankItemRepository;
import collzap.backend.repositories.TaskBankRepository;

/**
 * The daily rollover, and reading "today's task" for a group.
 *
 * <p>A group's day index is its own clock, not a shared calendar date — see
 * {@link GroupTaskProgress}'s javadoc. This service is what actually advances
 * that clock, once a day, only for groups that are currently ACTIVE.
 */
@Service
public class TaskAssignmentService {

    private static final Logger log = LoggerFactory.getLogger(TaskAssignmentService.class);
    public static final ZoneId TASK_ZONE = ZoneId.of("Asia/Kolkata");

    private final MatchGroupRepository matchGroupRepository;
    private final MatchMemberRepository matchMemberRepository;
    private final GroupTaskProgressRepository groupTaskProgressRepository;
    private final TaskBankRepository taskBankRepository;
    private final TaskBankItemRepository taskBankItemRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final NotificationService notificationService;

    public TaskAssignmentService(
        MatchGroupRepository matchGroupRepository,
        MatchMemberRepository matchMemberRepository,
        GroupTaskProgressRepository groupTaskProgressRepository,
        TaskBankRepository taskBankRepository,
        TaskBankItemRepository taskBankItemRepository,
        TaskAssignmentRepository taskAssignmentRepository,
        NotificationService notificationService
    ) {
        this.matchGroupRepository = matchGroupRepository;
        this.matchMemberRepository = matchMemberRepository;
        this.groupTaskProgressRepository = groupTaskProgressRepository;
        this.taskBankRepository = taskBankRepository;
        this.taskBankItemRepository = taskBankItemRepository;
        this.taskAssignmentRepository = taskAssignmentRepository;
        this.notificationService = notificationService;
    }

    /**
     * The once-a-day job. Two populations of work, both ticked the same way:
     * groups already mid-sequence that haven't been ticked today, and ACTIVE
     * groups with no progress row yet whose interest has an active bank.
     * Every group is its own transaction (see {@link #tickGroup}) so one bad
     * group can never roll back or block the rest of the run.
     *
     * <p>Returns a count of what actually happened. This exists because
     * "the job ran" and "the job did anything" are different questions — an
     * admin using the manual /run-now trigger to verify a freshly uploaded
     * bank has no other way to tell a real no-op (nothing eligible yet) apart
     * from a silent bug, since both look identical from the outside otherwise.
     */
    public RolloverResult runDailyRollover() {
        LocalDate today = LocalDate.now(TASK_ZONE);
        int candidates = 0;
        int assigned = 0;
        int completed = 0;

        List<GroupTaskProgress> existing = groupTaskProgressRepository
            .findTickableForStatus(MatchGroupStatus.ACTIVE, today);
        for (GroupTaskProgress progress : existing) {
            candidates++;
            TickOutcome outcome = tickSafely(progress.getMatchGroup().getId(), today);
            if (outcome == TickOutcome.ASSIGNED) assigned++;
            if (outcome == TickOutcome.COMPLETED) completed++;
        }

        for (TaskBank bank : taskBankRepository.findAllWithInterest()) {
            if (!bank.isActive() || bank.track() != TaskTrack.GROUP) continue;
            List<MatchGroup> activeGroups = matchGroupRepository
                .findByStatusAndInterestId(MatchGroupStatus.ACTIVE, bank.getInterest().getId());
            for (MatchGroup group : activeGroups) {
                if (groupTaskProgressRepository.findByMatchGroupId(group.getId()).isPresent()) {
                    continue; // already handled above, or already ticked today
                }
                candidates++;
                TickOutcome outcome = tickSafely(group.getId(), today);
                if (outcome == TickOutcome.ASSIGNED) assigned++;
                if (outcome == TickOutcome.COMPLETED) completed++;
            }
        }

        return new RolloverResult(candidates, assigned, completed);
    }

    private TickOutcome tickSafely(UUID matchGroupId, LocalDate today) {
        try {
            return tickGroup(matchGroupId, today);
        } catch (RuntimeException ex) {
            log.error("Daily task rollover failed for group {}; will retry on the next run", matchGroupId, ex);
            return TickOutcome.FAILED;
        }
    }

    public enum TickOutcome {
        /** A new day's task was created. */
        ASSIGNED,
        /** The bank ran out of days for this group — no wraparound. */
        COMPLETED,
        /** Nothing to do: not ACTIVE, no bank, already ticked today, or a duplicate-tick race. */
        NO_OP,
        /** Threw; logged, and left for the next run to retry. */
        FAILED
    }

    public record RolloverResult(int eligibleGroups, int assigned, int completed) {
        public String summary() {
            return "Checked %d eligible group(s): %d new assignment(s), %d bank(s) completed."
                .formatted(eligibleGroups, assigned, completed);
        }
    }

    /**
     * One group, one transaction. Public + non-private so the enclosing
     * per-group loop calls it through the Spring proxy and each iteration
     * really does get its own transaction boundary (a private method here
     * would just run inline in the caller's — nonexistent — transaction).
     */
    @Transactional
    public TickOutcome tickGroup(UUID matchGroupId, LocalDate today) {
        MatchGroup group = matchGroupRepository.findById(matchGroupId)
            .orElseThrow(() -> new NotFoundException("Match group not found"));
        if (group.getStatus() != MatchGroupStatus.ACTIVE) {
            log.debug("Skipping group {}: status is {}, not ACTIVE", matchGroupId, group.getStatus());
            return TickOutcome.NO_OP; // WAITING or CLOSED since this tick was queued — resumes on its own later
        }

        GroupTaskProgress progress = groupTaskProgressRepository.findByMatchGroupId(matchGroupId)
            .orElseGet(() -> {
                TaskBank bank = taskBankRepository.findActiveGroupBank(group.getInterest().getId())
                    .orElse(null);
                if (bank == null) {
                    log.debug("Skipping group {}: interest {} has no active task bank", matchGroupId, group.getInterest().getId());
                }
                return bank == null ? null : groupTaskProgressRepository.save(new GroupTaskProgress(group, bank));
            });
        if (progress == null) {
            return TickOutcome.NO_OP; // no active bank for this interest
        }
        if (progress.getLastAssignedDate() != null && progress.getLastAssignedDate().equals(today)) {
            log.debug("Skipping group {}: already ticked today ({})", matchGroupId, today);
            return TickOutcome.NO_OP;
        }
        if (progress.getCompletedAt() != null) {
            return TickOutcome.NO_OP;
        }

        int nextDay = progress.getCurrentDayIndex() + 1;
        Optional<TaskBankItem> item = taskBankItemRepository
            .findByTaskBankIdAndDayIndex(progress.getTaskBank().getId(), nextDay);
        if (item.isEmpty()) {
            progress.setCompletedAt(Instant.now());
            groupTaskProgressRepository.save(progress);
            return TickOutcome.COMPLETED;
        }

        try {
            TaskAssignment assignment = new TaskAssignment(progress, item.get(), group, nextDay, Instant.now());
            taskAssignmentRepository.save(assignment);
        } catch (DataIntegrityViolationException ex) {
            // The unique (progress, dayIndex) constraint caught a duplicate tick —
            // treat exactly like "already ticked today" and move on.
            log.warn("Duplicate daily-task tick suppressed for group {} day {}", matchGroupId, nextDay);
            return TickOutcome.NO_OP;
        }

        progress.setCurrentDayIndex(nextDay);
        progress.setLastAssignedDate(today);
        groupTaskProgressRepository.save(progress);

        notifyGroup(group, item.get());
        return TickOutcome.ASSIGNED;
    }

    private void notifyGroup(MatchGroup group, TaskBankItem item) {
        List<User> members = matchMemberRepository.findActiveWithUserByGroupId(group.getId()).stream()
            .map(MatchMember::getUser)
            .toList();
        notificationService.notifyAll(
            members,
            NotificationType.DAILY_TASK_ASSIGNED,
            "Today's task is ready",
            item.getTitle(),
            Map.of("matchGroupId", group.getId().toString(), "dayIndex", item.getDayIndex())
        );
    }

    @Transactional(readOnly = true)
    public TaskAssignmentResponse currentAssignmentOrNull(UUID matchGroupId, UUID userId) {
        requireActiveMember(matchGroupId, userId);
        return taskAssignmentRepository.findFirstByMatchGroupIdOrderByDayIndexDesc(matchGroupId)
            .map(TaskAssignmentService::toResponse).orElse(null);
    }

    boolean isBankCompleted(UUID matchGroupId) {
        return groupTaskProgressRepository.findByMatchGroupId(matchGroupId)
            .map(p -> p.getCompletedAt() != null)
            .orElse(false);
    }

    void requireActiveMember(UUID matchGroupId, UUID userId) {
        if (!matchMemberRepository.existsByMatchGroupIdAndUserIdAndActiveTrue(matchGroupId, userId)) {
            throw new ForbiddenException("You are not part of that group");
        }
    }

    static TaskAssignmentResponse toResponse(TaskAssignment a) {
        TaskBankItem item = a.getTaskBankItem();
        return new TaskAssignmentResponse(
            a.getId(),
            a.getDayIndex(),
            item.getTitle(),
            item.getLearnResource(),
            item.getDescription(),
            item.getSubmissionInstructions(),
            item.getPoints(),
            item.getDurationLabel(),
            a.getAssignedAt()
        );
    }
}
