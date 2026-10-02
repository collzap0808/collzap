package collzap.backend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import collzap.backend.dto.SoloTaskDtos.AdminSoloReviewRequest;
import collzap.backend.dto.SoloTaskDtos.AdminSoloSubmissionRow;
import collzap.backend.dto.SoloTaskDtos.SoloSubmissionView;
import collzap.backend.dto.SoloTaskDtos.SoloTaskItem;
import collzap.backend.dto.SoloTaskDtos.SoloTasksResponse;
import collzap.backend.dto.TaskDtos.SubmitTaskRequest;
import collzap.backend.enums.NotificationType;
import collzap.backend.enums.SoloReviewStatus;
import collzap.backend.enums.VerificationStatus;
import collzap.backend.exception.BadRequestException;
import collzap.backend.exception.ConflictException;
import collzap.backend.exception.NotFoundException;
import collzap.backend.models.Interest;
import collzap.backend.models.SoloTaskAssignment;
import collzap.backend.models.SoloTaskProgress;
import collzap.backend.models.SoloTaskSubmission;
import collzap.backend.models.TaskBank;
import collzap.backend.models.TaskBankItem;
import collzap.backend.models.User;
import collzap.backend.models.UserInterestSelection;
import collzap.backend.repositories.AdminUserRepository;
import collzap.backend.repositories.SoloTaskAssignmentRepository;
import collzap.backend.repositories.SoloTaskProgressRepository;
import collzap.backend.repositories.SoloTaskSubmissionRepository;
import collzap.backend.repositories.TaskBankItemRepository;
import collzap.backend.repositories.TaskBankRepository;
import collzap.backend.repositories.UserInterestSelectionRepository;

/**
 * Solo daily tasks: what a student does before peer matching unlocks.
 *
 * <p>Each selected interest that has an active SOLO bank gives the student one
 * task a day, on their own clock ({@link SoloTaskProgress}). An admin reviews
 * every submission; points are credited only on approval, and the approval that
 * carries a student past the unlock threshold opens matching for them. Once a
 * student is unlocked no new solo days are handed out — matched groups take over
 * with peer-reviewed group tasks.
 */
@Service
public class SoloTaskService {

    private static final Logger log = LoggerFactory.getLogger(SoloTaskService.class);
    private static final int QUEUE_LIMIT = 200;

    private final SoloTaskProgressRepository progressRepository;
    private final SoloTaskAssignmentRepository assignmentRepository;
    private final SoloTaskSubmissionRepository submissionRepository;
    private final TaskBankRepository taskBankRepository;
    private final TaskBankItemRepository taskBankItemRepository;
    private final UserInterestSelectionRepository selectionRepository;
    private final AdminUserRepository adminUserRepository;
    private final UserService userService;
    private final MatchingAccessService matchingAccessService;
    private final TaskSubmissionService taskSubmissionService;
    private final NotificationService notificationService;

    public SoloTaskService(
        SoloTaskProgressRepository progressRepository,
        SoloTaskAssignmentRepository assignmentRepository,
        SoloTaskSubmissionRepository submissionRepository,
        TaskBankRepository taskBankRepository,
        TaskBankItemRepository taskBankItemRepository,
        UserInterestSelectionRepository selectionRepository,
        AdminUserRepository adminUserRepository,
        UserService userService,
        MatchingAccessService matchingAccessService,
        TaskSubmissionService taskSubmissionService,
        NotificationService notificationService
    ) {
        this.progressRepository = progressRepository;
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.taskBankRepository = taskBankRepository;
        this.taskBankItemRepository = taskBankItemRepository;
        this.selectionRepository = selectionRepository;
        this.adminUserRepository = adminUserRepository;
        this.userService = userService;
        this.matchingAccessService = matchingAccessService;
        this.taskSubmissionService = taskSubmissionService;
        this.notificationService = notificationService;
    }

    /* ------------------------------------------------------------ student */

    /**
     * The student's solo tasks for today. While matching is locked this also
     * starts or advances each interest's clock, so day 1 appears the moment a
     * student finishes onboarding rather than at the next midnight run.
     */
    @Transactional
    public SoloTasksResponse today(UUID userId) {
        User user = userService.requireSelf(userId);
        MatchingAccessService.AccessState access = matchingAccessService.state(userId);
        LocalDate today = LocalDate.now(TaskAssignmentService.TASK_ZONE);

        List<SoloTaskItem> tasks = new ArrayList<>();
        for (Interest interest : interestsOf(userId)) {
            SoloTaskProgress progress = progressRepository.findByUserIdAndInterestId(userId, interest.getId()).orElse(null);
            if (progress == null && !access.unlocked() && user.getVerificationStatus() == VerificationStatus.APPROVED) {
                TaskBank bank = taskBankRepository.findActiveSoloBank(interest.getId()).orElse(null);
                if (bank != null) {
                    progress = progressRepository.save(new SoloTaskProgress(user, interest, bank));
                }
            }
            if (progress == null) {
                continue;
            }
            if (!access.unlocked()) {
                advance(progress, today);
            }
            currentAssignment(progress).ifPresent(a -> tasks.add(toItem(a, interest)));
        }
        return new SoloTasksResponse(!access.unlocked(), access.points(), access.unlockPoints(), tasks);
    }

    @Transactional
    public SoloSubmissionView submit(UUID userId, UUID assignmentId, SubmitTaskRequest request) {
        boolean hasContent = isNotBlank(request.contentText()) || isNotBlank(request.linkUrl()) || isNotBlank(request.fileUrl());
        if (!hasContent) {
            throw new BadRequestException("Add some text, a link, or a file before submitting");
        }
        SoloTaskAssignment assignment = assignmentRepository.findById(assignmentId)
            .filter(a -> a.getUser().getId().equals(userId))
            .orElseThrow(() -> new NotFoundException("Task not found"));
        User user = userService.requireSelf(userId);

        SoloTaskSubmission submission = submissionRepository.findByAssignmentId(assignmentId).orElse(null);
        if (submission != null && submission.getStatus() != SoloReviewStatus.CHANGES_REQUESTED) {
            throw new ConflictException(submission.getStatus() == SoloReviewStatus.PENDING
                ? "You've already submitted this task. It's waiting for review."
                : "This task is already approved");
        }
        if (submission == null) {
            submission = new SoloTaskSubmission(assignment, user);
        } else {
            // A resubmission after "request changes": fresh content, fresh review.
            submission.setStatus(SoloReviewStatus.PENDING);
            submission.setReviewedBy(null);
            submission.setReviewedAt(null);
            submission.setCompletionScore(null);
            submission.setQualityScore(null);
            submission.setLearningScore(null);
            submission.setEffortScore(null);
        }
        submission.setContentText(trimToNull(request.contentText()));
        submission.setLinkUrl(trimToNull(request.linkUrl()));
        submission.setFileUrl(trimToNull(request.fileUrl()));
        submission.setSubmittedAt(Instant.now());
        try {
            submission = submissionRepository.saveAndFlush(submission);
        } catch (DataIntegrityViolationException ex) {
            // Double-click race on the first submission: the unique assignment
            // constraint is the real guard; this just makes the message human.
            throw new ConflictException("You've already submitted this task. It's waiting for review.");
        }
        // Showing up keeps the streak alive; points wait for the admin's approval.
        taskSubmissionService.recordShowingUp(user);
        return toView(submission);
    }

    /* -------------------------------------------------------------- admin */

    @Transactional(readOnly = true)
    public List<AdminSoloSubmissionRow> queue(SoloReviewStatus status) {
        return submissionRepository.findQueue(status, PageRequest.of(0, QUEUE_LIMIT)).stream()
            .map(SoloTaskService::toRow)
            .toList();
    }

    @Transactional(readOnly = true)
    public long pendingCount() {
        return submissionRepository.countByStatus(SoloReviewStatus.PENDING);
    }

    @Transactional
    public AdminSoloSubmissionRow review(UUID adminId, UUID submissionId, AdminSoloReviewRequest request) {
        SoloTaskSubmission submission = submissionRepository.findForReview(submissionId)
            .orElseThrow(() -> new NotFoundException("Submission not found"));
        if (submission.getStatus() != SoloReviewStatus.PENDING) {
            throw new ConflictException("This submission has already been reviewed");
        }
        boolean approve = Boolean.TRUE.equals(request.approve());
        String feedback = trimToNull(request.feedbackText());
        if (approve && (request.completionScore() == null || request.qualityScore() == null
            || request.learningScore() == null || request.effortScore() == null)) {
            throw new BadRequestException("Score all four areas before approving");
        }
        if (!approve && feedback == null) {
            throw new BadRequestException("Tell the student what to change");
        }

        TaskBankItem item = submission.getAssignment().getTaskBankItem();
        User student = submission.getUser();
        submission.setStatus(approve ? SoloReviewStatus.APPROVED : SoloReviewStatus.CHANGES_REQUESTED);
        submission.setReviewedBy(adminUserRepository.findById(adminId).orElse(null));
        submission.setReviewedAt(Instant.now());
        submission.setFeedbackText(feedback);
        if (approve) {
            submission.setCompletionScore(request.completionScore());
            submission.setQualityScore(request.qualityScore());
            submission.setLearningScore(request.learningScore());
            submission.setEffortScore(request.effortScore());
            submission.setPointsAwarded(item.getPoints());
            taskSubmissionService.creditPoints(student, item.getPoints());
        }
        submissionRepository.save(submission);

        notificationService.notifyUser(
            student,
            NotificationType.SOLO_TASK_REVIEWED,
            approve ? "Task approved · +" + item.getPoints() + " pts" : "Your task needs a few changes",
            approve ? item.getTitle() : feedback,
            Map.of("submissionId", submission.getId().toString(), "status", submission.getStatus().name())
        );
        if (approve) {
            matchingAccessService.refresh(student, true);
        }
        return toRow(submission);
    }

    /* ---------------------------------------------------------- nightly */

    @Transactional(readOnly = true)
    public List<UUID> tickableProgressIds(LocalDate today) {
        return progressRepository.findTickable(today).stream().map(SoloTaskProgress::getId).toList();
    }

    /**
     * One progress row, one transaction; called through the proxy by the
     * scheduler so a bad row never blocks the rest. Stops handing out days once
     * the student has unlocked matching.
     *
     * @return true if a new day was assigned
     */
    @Transactional
    public boolean tickOne(UUID progressId, LocalDate today) {
        SoloTaskProgress progress = progressRepository.findById(progressId).orElse(null);
        if (progress == null || matchingAccessService.state(progress.getUser().getId()).unlocked()) {
            return false;
        }
        Optional<SoloTaskAssignment> assigned = advance(progress, today);
        assigned.ifPresent(a -> notificationService.notifyUser(
            progress.getUser(),
            NotificationType.DAILY_TASK_ASSIGNED,
            "Today's task is ready",
            a.getTaskBankItem().getTitle(),
            Map.of("soloAssignmentId", a.getId().toString(), "dayIndex", a.getDayIndex())
        ));
        return assigned.isPresent();
    }

    /* ------------------------------------------------------------ helpers */

    /**
     * Hands out the next day, at most once per IST day, and only once the current
     * day has been submitted — a student who skips a day picks up where they left
     * off instead of finding a pile of missed tasks.
     */
    private Optional<SoloTaskAssignment> advance(SoloTaskProgress progress, LocalDate today) {
        if (progress.getCompletedAt() != null || today.equals(progress.getLastAssignedDate())) {
            return Optional.empty();
        }
        Optional<SoloTaskAssignment> current = currentAssignment(progress);
        if (current.isPresent() && submissionRepository.findByAssignmentId(current.get().getId()).isEmpty()) {
            return Optional.empty();
        }
        int nextDay = progress.getCurrentDayIndex() + 1;
        Optional<TaskBankItem> item = taskBankItemRepository.findByTaskBankIdAndDayIndex(progress.getTaskBank().getId(), nextDay);
        if (item.isEmpty()) {
            progress.setCompletedAt(Instant.now());
            progressRepository.save(progress);
            return Optional.empty();
        }
        SoloTaskAssignment assignment = assignmentRepository.save(
            new SoloTaskAssignment(progress, progress.getUser(), item.get(), nextDay, Instant.now()));
        progress.setCurrentDayIndex(nextDay);
        progress.setLastAssignedDate(today);
        progressRepository.save(progress);
        log.debug("Solo day {} assigned to user {} for interest {}", nextDay, progress.getUser().getId(), progress.getInterest().getId());
        return Optional.of(assignment);
    }

    private Optional<SoloTaskAssignment> currentAssignment(SoloTaskProgress progress) {
        return assignmentRepository.findByProgressNewestFirst(progress.getId()).stream().findFirst();
    }

    /** Distinct interests across the student's project types, in selection order. */
    private List<Interest> interestsOf(UUID userId) {
        Map<UUID, Interest> byId = new LinkedHashMap<>();
        for (UserInterestSelection s : selectionRepository.findAllWithInterestByUserId(userId)) {
            byId.putIfAbsent(s.getInterest().getId(), s.getInterest());
        }
        return new ArrayList<>(byId.values());
    }

    private SoloTaskItem toItem(SoloTaskAssignment a, Interest interest) {
        TaskBankItem item = a.getTaskBankItem();
        SoloSubmissionView submission = submissionRepository.findByAssignmentId(a.getId()).map(SoloTaskService::toView).orElse(null);
        return new SoloTaskItem(
            a.getId(), interest.getId(), interest.getName(), a.getDayIndex(), item.getTitle(), item.getLearnResource(),
            item.getDescription(), item.getSubmissionInstructions(), item.getPoints(), item.getDurationLabel(),
            a.getAssignedAt(), submission
        );
    }

    private static SoloSubmissionView toView(SoloTaskSubmission s) {
        return new SoloSubmissionView(
            s.getId(), s.getContentText(), s.getLinkUrl(), s.getFileUrl(), s.getSubmittedAt(), s.getStatus(),
            s.getCompletionScore(), s.getQualityScore(), s.getLearningScore(), s.getEffortScore(),
            s.getFeedbackText(), s.getReviewedAt(), s.getPointsAwarded()
        );
    }

    private static AdminSoloSubmissionRow toRow(SoloTaskSubmission s) {
        SoloTaskAssignment a = s.getAssignment();
        TaskBankItem item = a.getTaskBankItem();
        User u = s.getUser();
        return new AdminSoloSubmissionRow(
            s.getId(), u.getId(), u.getName(), u.getEmail(), u.getCollege() == null ? null : u.getCollege().getName(),
            a.getProgress().getInterest().getName(), a.getDayIndex(), item.getTitle(), item.getDescription(),
            item.getSubmissionInstructions(), item.getPoints(),
            s.getContentText(), s.getLinkUrl(), s.getFileUrl(), s.getSubmittedAt(), s.getStatus(),
            s.getCompletionScore(), s.getQualityScore(), s.getLearningScore(), s.getEffortScore(),
            s.getFeedbackText(), s.getReviewedAt(), s.getPointsAwarded(),
            s.getReviewedBy() == null ? null : s.getReviewedBy().getUsername()
        );
    }

    private static boolean isNotBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static String trimToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
