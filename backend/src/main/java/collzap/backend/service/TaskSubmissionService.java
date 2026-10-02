package collzap.backend.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import collzap.backend.dto.TaskDtos.ActivityItem;
import collzap.backend.dto.TaskDtos.ReviewResponse;
import collzap.backend.dto.TaskDtos.ReviewSubmissionRequest;
import collzap.backend.dto.TaskDtos.SubmissionResponse;
import collzap.backend.dto.TaskDtos.SubmitTaskRequest;
import collzap.backend.dto.TaskDtos.TaskCalendarResponse;
import collzap.backend.dto.TaskDtos.TaskCalendarResponse.DayCount;
import collzap.backend.dto.TaskDtos.TodaysTaskResponse;
import collzap.backend.dto.TaskDtos.UserTaskStatsResponse;
import collzap.backend.enums.NotificationType;
import collzap.backend.exception.BadRequestException;
import collzap.backend.exception.ConflictException;
import collzap.backend.exception.ForbiddenException;
import collzap.backend.exception.NotFoundException;
import collzap.backend.models.MatchGroup;
import collzap.backend.models.TaskAssignment;
import collzap.backend.models.TaskReview;
import collzap.backend.models.TaskSubmission;
import collzap.backend.models.User;
import collzap.backend.models.UserTaskStats;
import collzap.backend.repositories.MatchMemberRepository;
import collzap.backend.repositories.SessionAttendanceRepository;
import collzap.backend.repositories.SoloTaskSubmissionRepository;
import collzap.backend.repositories.TaskAssignmentRepository;
import collzap.backend.repositories.TaskReviewRepository;
import collzap.backend.repositories.TaskSubmissionRepository;
import collzap.backend.repositories.UserTaskStatsRepository;

/**
 * Submitting a task and reviewing a peer's submission. "Peer" is deliberately
 * unrestricted here — any active member of the group may review any other
 * active member's submission, which is what makes this work identically at
 * two people or forty rather than needing a fixed pairing.
 */
@Service
public class TaskSubmissionService {

    /** Flat, mirrors the source plan's "+30 review points" — credited to the reviewer only. */
    private static final int REVIEW_POINTS = 30;

    private final TaskAssignmentService taskAssignmentService;
    private final MatchMemberRepository matchMemberRepository;
    private final TaskAssignmentRepository taskAssignmentRepository;
    private final TaskSubmissionRepository taskSubmissionRepository;
    private final TaskReviewRepository taskReviewRepository;
    private final UserTaskStatsRepository userTaskStatsRepository;
    private final SessionAttendanceRepository sessionAttendanceRepository;
    private final UserService userService;
    private final NotificationService notificationService;
    private final SoloTaskSubmissionRepository soloTaskSubmissionRepository;
    private final MatchingAccessService matchingAccessService;

    public TaskSubmissionService(
        TaskAssignmentService taskAssignmentService,
        MatchMemberRepository matchMemberRepository,
        TaskAssignmentRepository taskAssignmentRepository,
        TaskSubmissionRepository taskSubmissionRepository,
        TaskReviewRepository taskReviewRepository,
        UserTaskStatsRepository userTaskStatsRepository,
        SessionAttendanceRepository sessionAttendanceRepository,
        UserService userService,
        NotificationService notificationService,
        SoloTaskSubmissionRepository soloTaskSubmissionRepository,
        MatchingAccessService matchingAccessService
    ) {
        this.soloTaskSubmissionRepository = soloTaskSubmissionRepository;
        this.matchingAccessService = matchingAccessService;
        this.taskAssignmentService = taskAssignmentService;
        this.matchMemberRepository = matchMemberRepository;
        this.taskAssignmentRepository = taskAssignmentRepository;
        this.taskSubmissionRepository = taskSubmissionRepository;
        this.taskReviewRepository = taskReviewRepository;
        this.userTaskStatsRepository = userTaskStatsRepository;
        this.sessionAttendanceRepository = sessionAttendanceRepository;
        this.userService = userService;
        this.notificationService = notificationService;
    }

    @Transactional(readOnly = true)
    public TodaysTaskResponse todaysTask(UUID matchGroupId, UUID callerId) {
        taskAssignmentService.requireActiveMember(matchGroupId, callerId);
        var assignment = taskAssignmentRepository.findFirstByMatchGroupIdOrderByDayIndexDesc(matchGroupId);
        if (assignment.isEmpty()) {
            return new TodaysTaskResponse(null, taskAssignmentService.isBankCompleted(matchGroupId), List.of());
        }
        List<SubmissionResponse> submissions = taskSubmissionRepository
            .findByAssignmentId(assignment.get().getId()).stream()
            .map(s -> toSubmissionResponse(s, callerId))
            .toList();
        return new TodaysTaskResponse(TaskAssignmentService.toResponse(assignment.get()), false, submissions);
    }

    @Transactional
    public SubmissionResponse submit(UUID matchGroupId, UUID assignmentId, UUID callerId, SubmitTaskRequest request) {
        taskAssignmentService.requireActiveMember(matchGroupId, callerId);

        boolean hasContent = isNotBlank(request.contentText()) || isNotBlank(request.linkUrl()) || isNotBlank(request.fileUrl());
        if (!hasContent) {
            throw new BadRequestException("Add some text, a link, or a file before submitting");
        }

        TaskAssignment assignment = taskAssignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new NotFoundException("Task not found"));
        if (!assignment.getMatchGroup().getId().equals(matchGroupId)) {
            throw new NotFoundException("Task not found");
        }
        if (taskSubmissionRepository.findByTaskAssignmentIdAndUserId(assignmentId, callerId).isPresent()) {
            throw new ConflictException("You've already submitted this task");
        }

        User user = userService.requireSelf(callerId);
        // Everything from here down that writes is inside one guard, not just the
        // TaskSubmission insert — creditActivity() below has its own check-then-write
        // against UserTaskStats (keyed on user_id), and a race there would surface
        // through this exact same generic constraint error if left unwrapped.
        try {
            TaskSubmission submission = taskSubmissionRepository.save(new TaskSubmission(
                assignment, user, trimToNull(request.contentText()), trimToNull(request.linkUrl()),
                trimToNull(request.fileUrl()), Instant.now()
            ));
            creditActivity(user, assignment.getTaskBankItem().getPoints(), true);
            return toSubmissionResponse(submission, callerId);
        } catch (DataIntegrityViolationException ex) {
            // The exists-check above and the insert(s) below aren't atomic, so a
            // double submit (a fast double-click before the button's disabled
            // state catches up) can pass the check twice and race to the same
            // unique constraint. The constraint is still the real guard; this
            // only turns its generic "constraint violation" into a clear message.
            throw new ConflictException("You've already submitted this task");
        }
    }

    @Transactional
    public ReviewResponse review(UUID matchGroupId, UUID submissionId, UUID callerId, ReviewSubmissionRequest request) {
        taskAssignmentService.requireActiveMember(matchGroupId, callerId);

        TaskSubmission submission = taskSubmissionRepository.findWithUserAndAssignmentById(submissionId)
            .orElseThrow(() -> new NotFoundException("Submission not found"));
        if (!submission.getTaskAssignment().getMatchGroup().getId().equals(matchGroupId)) {
            throw new NotFoundException("Submission not found");
        }
        if (submission.getUser().getId().equals(callerId)) {
            throw new ForbiddenException("You can't review your own submission");
        }
        if (taskReviewRepository.existsBySubmissionIdAndReviewerId(submissionId, callerId)) {
            throw new ConflictException("You've already reviewed this submission");
        }

        User reviewer = userService.requireSelf(callerId);
        // Same reasoning as submit() above: the guard covers every write this
        // method does, not just the TaskReview insert, because creditActivity()'s
        // own check-then-write (against UserTaskStats) can independently race.
        try {
            TaskReview review = taskReviewRepository.save(new TaskReview(
                submission, reviewer,
                request.completionScore(), request.qualityScore(), request.learningScore(), request.effortScore(),
                trimToNull(request.feedbackText()), Instant.now()
            ));
            creditActivity(reviewer, REVIEW_POINTS, false);
            notifySubmitterOfReview(submission, reviewer);
            return toReviewResponse(review);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("You've already reviewed this submission");
        }
    }

    @Transactional(readOnly = true)
    public UserTaskStatsResponse myStats(UUID userId) {
        // The stored streak only changes when the user next acts, so a missed day
        // would otherwise leave it showing its old value forever. It is still alive
        // if the last activity was today or yesterday (today's action can still save
        // it); anything older means the streak is broken and reads as 0.
        LocalDate today = LocalDate.now(TaskAssignmentService.TASK_ZONE);

        int tasksDone = (int) (taskSubmissionRepository.countByUserId(userId) + soloTaskSubmissionRepository.countByUserId(userId));
        int reviewsGiven = (int) taskReviewRepository.countByReviewerId(userId);
        int sessionsWatched = (int) sessionAttendanceRepository.countByUserIdAndCompletedAtIsNotNull(userId);

        List<ActivityItem> activity = new ArrayList<>();
        taskSubmissionRepository.findTop3ByUserIdOrderBySubmittedAtDesc(userId).forEach(s -> {
            var item = s.getTaskAssignment().getTaskBankItem();
            activity.add(new ActivityItem("TASK", item.getTitle(), item.getPoints(), s.getSubmittedAt()));
        });
        taskReviewRepository.findTop3ByReviewerIdOrderByReviewedAtDesc(userId).forEach(r -> activity.add(new ActivityItem(
            "REVIEW", "Reviewed: " + r.getSubmission().getTaskAssignment().getTaskBankItem().getTitle(), REVIEW_POINTS, r.getReviewedAt())));
        // Solo tasks: points only once an admin approves, so pending work shows 0.
        soloTaskSubmissionRepository.findLatestByUser(userId, PageRequest.of(0, 3)).forEach(s -> {
            String title = s.getAssignment().getTaskBankItem().getTitle();
            String suffix = switch (s.getStatus()) {
                case PENDING -> " · pending review";
                case CHANGES_REQUESTED -> " · changes requested";
                case APPROVED -> "";
            };
            activity.add(new ActivityItem("TASK", title + suffix, s.getPointsAwarded(), s.getSubmittedAt()));
        });
        sessionAttendanceRepository.findTop3ByUserIdAndCompletedAtIsNotNullOrderByCompletedAtDesc(userId).forEach(a -> activity.add(new ActivityItem(
            "SESSION", "Watched: " + a.getSession().getTitle(), a.getPointsAwarded(), a.getCompletedAt())));
        List<ActivityItem> recent = activity.stream()
            .sorted(Comparator.comparing(ActivityItem::at).reversed())
            .limit(3)
            .toList();

        MatchingAccessService.AccessState access = matchingAccessService.state(userId);
        return userTaskStatsRepository.findByUserId(userId)
            .map(s -> {
                LocalDate last = s.getLastActivityDate();
                boolean alive = last != null && !last.isBefore(today.minusDays(1));
                return new UserTaskStatsResponse(
                    s.getTotalPoints(), alive ? s.getCurrentStreakDays() : 0, s.getLongestStreakDays(),
                    tasksDone, reviewsGiven, sessionsWatched, recent, access.unlocked(), access.unlockPoints());
            })
            .orElse(new UserTaskStatsResponse(0, 0, 0, tasksDone, reviewsGiven, sessionsWatched, recent,
                access.unlocked(), access.unlockPoints()));
    }

    /**
     * Days with at least one of the caller's own submissions in the given IST
     * month — the same rule the streak uses, so the calendar and the streak
     * number never disagree. Reviews earn points but never light up a day.
     */
    @Transactional(readOnly = true)
    public TaskCalendarResponse monthCalendar(UUID userId, YearMonth month) {
        YearMonth current = YearMonth.now(TaskAssignmentService.TASK_ZONE);
        if (month.isAfter(current) || month.isBefore(current.minusMonths(24))) {
            throw new BadRequestException("That month is out of range");
        }
        ZoneId zone = TaskAssignmentService.TASK_ZONE;
        Instant from = month.atDay(1).atStartOfDay(zone).toInstant();
        Instant to = month.plusMonths(1).atDay(1).atStartOfDay(zone).toInstant();

        List<Instant> submittedAt = new ArrayList<>(taskSubmissionRepository.findSubmittedAtByUserBetween(userId, from, to));
        submittedAt.addAll(soloTaskSubmissionRepository.findSubmittedAtByUserBetween(userId, from, to));
        Map<LocalDate, Long> counts = new TreeMap<>(
            submittedAt.stream()
                .collect(Collectors.groupingBy(i -> i.atZone(zone).toLocalDate(), Collectors.counting()))
        );
        List<DayCount> days = counts.entrySet().stream()
            .map(e -> new DayCount(e.getKey(), e.getValue().intValue()))
            .toList();
        return new TaskCalendarResponse(month.toString(), days);
    }

    /** A solo-task submission: keeps the streak alive now; its points arrive when an admin approves. */
    @Transactional
    public void recordShowingUp(User user) {
        creditActivity(user, 0, true);
    }

    /** Points for something other than a task (e.g. a watched mentoring session) — never touches the streak. */
    @Transactional
    public void creditPoints(User user, int points) {
        creditActivity(user, points, false);
    }

    /**
     * Points are credited for both submitting and reviewing, but only a
     * submission extends the streak — at most once per IST calendar day, resetting
     * to 1 after any gap. Reviewing someone else's work never keeps a streak alive.
     *
     * <p>Has the same check-then-write shape as submit()/review() themselves —
     * "does this user already have a stats row?" then insert-or-update — so it
     * carries the same race: two of a user's own actions landing close enough
     * together (e.g. submitting a task and reviewing someone else's within the
     * same instant) can both see "no row yet" and both try to create one. Unlike
     * submit()/review(), a genuine collision here isn't a duplicate to reject —
     * both actions are legitimate and both deserve their points — so this
     * self-heals: on a unique-constraint hit for a row we thought was new, it
     * re-reads the row the other call just created and applies this credit on
     * top of it instead of failing the whole request.
     */
    private void creditActivity(User user, int points, boolean extendsStreak) {
        UserTaskStats stats = userTaskStatsRepository.findByUserId(user.getId()).orElse(null);
        boolean wasNew = stats == null;
        if (wasNew) {
            stats = new UserTaskStats(user);
        }
        applyCredit(stats, points, extendsStreak);
        try {
            userTaskStatsRepository.save(stats);
        } catch (DataIntegrityViolationException ex) {
            if (!wasNew) {
                throw ex; // an update hit a constraint for some other reason — a real problem, don't mask it
            }
            UserTaskStats existing = userTaskStatsRepository.findByUserId(user.getId()).orElseThrow(() -> ex);
            applyCredit(existing, points, extendsStreak);
            userTaskStatsRepository.save(existing);
        }
    }

    private void applyCredit(UserTaskStats stats, int points, boolean extendsStreak) {
        stats.setTotalPoints(stats.getTotalPoints() + points);
        if (!extendsStreak) {
            return;
        }
        LocalDate today = LocalDate.now(TaskAssignmentService.TASK_ZONE);
        LocalDate last = stats.getLastActivityDate();

        if (last == null || last.equals(today.minusDays(1))) {
            stats.setCurrentStreakDays(stats.getCurrentStreakDays() + 1);
        } else if (!last.equals(today)) {
            stats.setCurrentStreakDays(1);
        }
        stats.setLastActivityDate(today);
        stats.setLongestStreakDays(Math.max(stats.getLongestStreakDays(), stats.getCurrentStreakDays()));
    }

    private void notifySubmitterOfReview(TaskSubmission submission, User reviewer) {
        MatchGroup group = submission.getTaskAssignment().getMatchGroup();
        matchMemberRepository.findByMatchGroupIdAndUserId(group.getId(), submission.getUser().getId())
            .filter(m -> m.isActive())
            .ifPresent(m -> notificationService.notifyUser(
                submission.getUser(),
                NotificationType.DAILY_TASK_ASSIGNED,
                "Your submission was reviewed",
                reviewer.getName() + " left feedback on your task",
                Map.of("matchGroupId", group.getId().toString(), "submissionId", submission.getId().toString())
            ));
    }

    private SubmissionResponse toSubmissionResponse(TaskSubmission s, UUID callerId) {
        List<ReviewResponse> reviews = taskReviewRepository.findBySubmissionId(s.getId()).stream()
            .map(TaskSubmissionService::toReviewResponse)
            .toList();
        boolean reviewedByMe = reviews.stream().anyMatch(r -> r.reviewerId().equals(callerId));
        return new SubmissionResponse(
            s.getId(), s.getUser().getId(), s.getUser().getName(), s.getUser().getProfilePhotoUrl(),
            s.getContentText(), s.getLinkUrl(), s.getFileUrl(), s.getSubmittedAt(),
            s.getUser().getId().equals(callerId), reviewedByMe, reviews
        );
    }

    private static ReviewResponse toReviewResponse(TaskReview r) {
        return new ReviewResponse(
            r.getId(), r.getReviewer().getId(), r.getReviewer().getName(),
            r.getCompletionScore(), r.getQualityScore(), r.getLearningScore(), r.getEffortScore(),
            r.getFeedbackText(), r.getReviewedAt()
        );
    }

    private static boolean isNotBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String trimmed = s.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
