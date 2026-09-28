package collzap.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import collzap.backend.dto.CommonDtos.MessageResponse;
import collzap.backend.dto.MentorSessionDtos.SaveSessionRequest;
import collzap.backend.dto.MentorSessionDtos.SessionResponse;
import collzap.backend.service.MentorSessionService;
import jakarta.validation.Valid;

/**
 * Admin scheduling of mentoring sessions. A session saved without a YouTube
 * link shows to students as upcoming; editing it later to add the link (with a
 * time that has passed) publishes it.
 */
@RestController
@RequestMapping("/api/admin/sessions")
public class AdminMentorSessionController {

    private final MentorSessionService mentorSessionService;

    public AdminMentorSessionController(MentorSessionService mentorSessionService) {
        this.mentorSessionService = mentorSessionService;
    }

    @GetMapping
    public List<SessionResponse> list(@RequestParam(required = false) UUID interestId) {
        return mentorSessionService.adminList(interestId);
    }

    @PostMapping
    public ResponseEntity<SessionResponse> create(@Valid @RequestBody SaveSessionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(mentorSessionService.create(request));
    }

    @PutMapping("/{sessionId}")
    public SessionResponse update(@PathVariable UUID sessionId, @Valid @RequestBody SaveSessionRequest request) {
        return mentorSessionService.update(sessionId, request);
    }

    @DeleteMapping("/{sessionId}")
    public MessageResponse delete(@PathVariable UUID sessionId) {
        mentorSessionService.delete(sessionId);
        return MessageResponse.of("Session deleted");
    }
}
