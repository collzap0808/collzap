package collzap.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import collzap.backend.dto.SoloTaskDtos.AdminSoloReviewRequest;
import collzap.backend.dto.SoloTaskDtos.AdminSoloSubmissionRow;
import collzap.backend.dto.SoloTaskDtos.PendingCountResponse;
import collzap.backend.enums.SoloReviewStatus;
import collzap.backend.security.AuthPrincipal;
import collzap.backend.service.SoloTaskService;
import jakarta.validation.Valid;

/** The admin queue for solo-task submissions from students who haven't unlocked matching yet. */
@RestController
@RequestMapping("/api/admin/solo-submissions")
public class AdminSoloTaskController {

    private final SoloTaskService soloTaskService;

    public AdminSoloTaskController(SoloTaskService soloTaskService) {
        this.soloTaskService = soloTaskService;
    }

    @GetMapping
    public List<AdminSoloSubmissionRow> list(@RequestParam(defaultValue = "PENDING") SoloReviewStatus status) {
        return soloTaskService.queue(status);
    }

    @GetMapping("/pending-count")
    public PendingCountResponse pendingCount() {
        return new PendingCountResponse(soloTaskService.pendingCount());
    }

    @PostMapping("/{submissionId}/review")
    public AdminSoloSubmissionRow review(
        @AuthenticationPrincipal AuthPrincipal operator,
        @PathVariable UUID submissionId,
        @Valid @RequestBody AdminSoloReviewRequest request
    ) {
        return soloTaskService.review(operator.userId(), submissionId, request);
    }
}
