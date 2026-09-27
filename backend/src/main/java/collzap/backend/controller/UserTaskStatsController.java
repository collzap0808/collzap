package collzap.backend.controller;

import java.time.YearMonth;
import java.time.format.DateTimeParseException;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import collzap.backend.dto.TaskDtos.TaskCalendarResponse;
import collzap.backend.dto.TaskDtos.UserTaskStatsResponse;
import collzap.backend.exception.BadRequestException;
import collzap.backend.security.AuthPrincipal;
import collzap.backend.service.TaskAssignmentService;
import collzap.backend.service.TaskSubmissionService;

/** Points and streak, across every group and interest the caller is in. */
@RestController
@RequestMapping("/api/me/task-stats")
public class UserTaskStatsController {

    private final TaskSubmissionService taskSubmissionService;

    public UserTaskStatsController(TaskSubmissionService taskSubmissionService) {
        this.taskSubmissionService = taskSubmissionService;
    }

    @GetMapping
    public UserTaskStatsResponse myStats(@AuthenticationPrincipal AuthPrincipal me) {
        return taskSubmissionService.myStats(me.userId());
    }

    /** {@code month} as "YYYY-MM"; defaults to the current IST month. */
    @GetMapping("/calendar")
    public TaskCalendarResponse calendar(
        @AuthenticationPrincipal AuthPrincipal me,
        @RequestParam(required = false) String month
    ) {
        YearMonth ym;
        try {
            ym = month == null || month.isBlank()
                ? YearMonth.now(TaskAssignmentService.TASK_ZONE)
                : YearMonth.parse(month);
        } catch (DateTimeParseException ex) {
            throw new BadRequestException("Month must look like 2026-09");
        }
        return taskSubmissionService.monthCalendar(me.userId(), ym);
    }
}
