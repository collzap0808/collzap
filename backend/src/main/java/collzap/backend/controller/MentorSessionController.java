package collzap.backend.controller;

import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import collzap.backend.dto.MentorSessionDtos.CompleteSessionResponse;
import collzap.backend.dto.MentorSessionDtos.SessionListResponse;
import collzap.backend.dto.MentorSessionDtos.SessionResponse;
import collzap.backend.ratelimit.RateLimited;
import collzap.backend.security.AuthPrincipal;
import collzap.backend.service.MentorSessionService;

/** Mentoring sessions for the caller's interests — watching one earns its points once. */
@RestController
@RequestMapping("/api/sessions")
public class MentorSessionController {

    private final MentorSessionService mentorSessionService;

    public MentorSessionController(MentorSessionService mentorSessionService) {
        this.mentorSessionService = mentorSessionService;
    }

    @GetMapping
    public SessionListResponse list(@AuthenticationPrincipal AuthPrincipal me) {
        return mentorSessionService.listForUser(me.userId());
    }

    @GetMapping("/{sessionId}")
    public SessionResponse get(@AuthenticationPrincipal AuthPrincipal me, @PathVariable UUID sessionId) {
        return mentorSessionService.get(me.userId(), sessionId);
    }

    @RateLimited(name = "session-start", limit = 60, windowSeconds = 3600)
    @PostMapping("/{sessionId}/start")
    public SessionResponse start(@AuthenticationPrincipal AuthPrincipal me, @PathVariable UUID sessionId) {
        return mentorSessionService.start(me.userId(), sessionId);
    }

    @RateLimited(name = "session-complete", limit = 30, windowSeconds = 3600)
    @PostMapping("/{sessionId}/complete")
    public CompleteSessionResponse complete(@AuthenticationPrincipal AuthPrincipal me, @PathVariable UUID sessionId) {
        return mentorSessionService.complete(me.userId(), sessionId);
    }
}
