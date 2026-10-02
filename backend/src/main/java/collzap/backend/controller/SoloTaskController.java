package collzap.backend.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import collzap.backend.dto.SoloTaskDtos.SoloSubmissionView;
import collzap.backend.dto.SoloTaskDtos.SoloTasksResponse;
import collzap.backend.dto.TaskDtos.SubmitTaskRequest;
import collzap.backend.ratelimit.RateLimited;
import collzap.backend.security.AuthPrincipal;
import collzap.backend.service.SoloTaskService;
import jakarta.validation.Valid;

/** A student's solo daily tasks, done before peer matching unlocks. */
@RestController
@RequestMapping("/api/me/solo-tasks")
public class SoloTaskController {

    private final SoloTaskService soloTaskService;

    public SoloTaskController(SoloTaskService soloTaskService) {
        this.soloTaskService = soloTaskService;
    }

    @GetMapping
    public SoloTasksResponse today(@AuthenticationPrincipal AuthPrincipal me) {
        return soloTaskService.today(me.userId());
    }

    @RateLimited(name = "solo-task-submission", limit = 30, windowSeconds = 3600)
    @PostMapping("/{assignmentId}/submissions")
    public ResponseEntity<SoloSubmissionView> submit(
        @AuthenticationPrincipal AuthPrincipal me,
        @PathVariable UUID assignmentId,
        @Valid @RequestBody SubmitTaskRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(soloTaskService.submit(me.userId(), assignmentId, request));
    }
}
