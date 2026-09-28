package collzap.backend.service;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import collzap.backend.dto.MentorSessionDtos.CompleteSessionResponse;
import collzap.backend.dto.MentorSessionDtos.SaveSessionRequest;
import collzap.backend.dto.MentorSessionDtos.SessionListResponse;
import collzap.backend.dto.MentorSessionDtos.SessionResponse;
import collzap.backend.exception.BadRequestException;
import collzap.backend.exception.ConflictException;
import collzap.backend.exception.NotFoundException;
import collzap.backend.models.Interest;
import collzap.backend.models.MentorSession;
import collzap.backend.models.SessionAttendance;
import collzap.backend.models.User;
import collzap.backend.repositories.InterestRepository;
import collzap.backend.repositories.MentorSessionRepository;
import collzap.backend.repositories.SessionAttendanceRepository;
import collzap.backend.repositories.UserInterestSelectionRepository;

/**
 * Mentoring sessions are shown to students who picked the session's interest.
 * Points need two things: the player reports ~80% real playback (client side),
 * and enough real time has elapsed since the first play to have watched that
 * much (server side), so calling /complete directly earns nothing.
 */
@Service
public class MentorSessionService {

    // 80% of the session watched at up to 2x speed — the player already refuses
    // skipped-over seconds, so this floor only has to stop a direct /complete call,
    // not punish someone who watched at 1.5x or 2x.
    static final double MIN_ELAPSED_FRACTION = 0.4;

    // Covers watch?v=, youtu.be/, /embed/, /shorts/, /live/ and /v/ links, with or
    // without www./m./music. and any trailing query string.
    private static final Pattern YOUTUBE_URL = Pattern.compile(
        "^(?:https?://)?(?:(?:www|m|music)\\.)?(?:youtube\\.com/(?:watch\\?(?:.*&)?v=|embed/|shorts/|live/|v/)|youtu\\.be/)([A-Za-z0-9_-]{11})(?:[?&#/].*)?$"
    );
    private static final Pattern BARE_ID = Pattern.compile("^[A-Za-z0-9_-]{11}$");

    private final MentorSessionRepository sessionRepository;
    private final SessionAttendanceRepository attendanceRepository;
    private final UserInterestSelectionRepository selectionRepository;
    private final InterestRepository interestRepository;
    private final UserService userService;
    private final TaskSubmissionService taskSubmissionService;

    public MentorSessionService(
        MentorSessionRepository sessionRepository,
        SessionAttendanceRepository attendanceRepository,
        UserInterestSelectionRepository selectionRepository,
        InterestRepository interestRepository,
        UserService userService,
        TaskSubmissionService taskSubmissionService
    ) {
        this.sessionRepository = sessionRepository;
        this.attendanceRepository = attendanceRepository;
        this.selectionRepository = selectionRepository;
        this.interestRepository = interestRepository;
        this.userService = userService;
        this.taskSubmissionService = taskSubmissionService;
    }

    // ---------------------------------------------------------------- student

    @Transactional(readOnly = true)
    public SessionListResponse listForUser(UUID userId) {
        Set<UUID> interestIds = interestIdsOf(userId);
        if (interestIds.isEmpty()) {
            return new SessionListResponse(null, List.of(), List.of());
        }
        List<MentorSession> sessions = sessionRepository.findByInterestIdInOrderByScheduledAtDesc(interestIds);
        Map<UUID, SessionAttendance> attendance = attendanceRepository
            .findByUserIdAndSessionIdIn(userId, sessions.stream().map(MentorSession::getId).toList()).stream()
            .collect(Collectors.toMap(a -> a.getSession().getId(), Function.identity()));

        Instant now = Instant.now();
        List<SessionResponse> available = sessions.stream()
            .filter(s -> s.isAvailable(now))
            .map(s -> toResponse(s, attendance.get(s.getId()), now, false))
            .toList();
        List<SessionResponse> upcoming = sessions.stream()
            .filter(s -> !s.isAvailable(now))
            .sorted(Comparator.comparing(MentorSession::getScheduledAt))
            .map(s -> toResponse(s, attendance.get(s.getId()), now, false))
            .toList();
        SessionResponse featured = available.stream().filter(s -> !s.watched()).findFirst()
            .orElse(available.isEmpty() ? null : available.getFirst());

        return new SessionListResponse(featured, available, upcoming);
    }

    @Transactional(readOnly = true)
    public SessionResponse get(UUID userId, UUID sessionId) {
        MentorSession session = requireVisible(userId, sessionId);
        SessionAttendance attendance = attendanceRepository.findBySessionIdAndUserId(sessionId, userId).orElse(null);
        return toResponse(session, attendance, Instant.now(), false);
    }

    /** Records the first play. Calling it again is a no-op, so the timer can't be reset. */
    @Transactional
    public SessionResponse start(UUID userId, UUID sessionId) {
        MentorSession session = requireVisible(userId, sessionId);
        Instant now = Instant.now();
        if (!session.isAvailable(now)) {
            throw new BadRequestException("This session hasn't started yet");
        }
        SessionAttendance attendance = attendanceRepository.findBySessionIdAndUserId(sessionId, userId).orElse(null);
        if (attendance == null) {
            try {
                attendance = attendanceRepository.saveAndFlush(new SessionAttendance(session, userService.requireSelf(userId), now));
            } catch (DataIntegrityViolationException ex) {
                // Two tabs pressing play at once — the other one already created the row.
                throw new ConflictException("Session already started");
            }
        }
        return toResponse(session, attendance, now, false);
    }

    @Transactional
    public CompleteSessionResponse complete(UUID userId, UUID sessionId) {
        MentorSession session = requireVisible(userId, sessionId);
        Instant now = Instant.now();
        if (!session.isAvailable(now)) {
            throw new BadRequestException("This session hasn't started yet");
        }
        SessionAttendance attendance = attendanceRepository.findBySessionIdAndUserId(sessionId, userId)
            .orElseThrow(() -> new BadRequestException("Play the session first"));

        if (attendance.getCompletedAt() != null) {
            return new CompleteSessionResponse(0, true, toResponse(session, attendance, now, false));
        }

        Duration required = Duration.ofSeconds(Math.round(session.getDurationMinutes() * 60 * MIN_ELAPSED_FRACTION));
        if (Duration.between(attendance.getStartedAt(), now).compareTo(required) < 0) {
            throw new BadRequestException("Keep watching — points unlock after most of the session");
        }

        // Conditional update rather than set-and-save: two tabs finishing at once
        // both pass the completedAt check above, but only one of them wins here.
        if (attendanceRepository.markCompleted(attendance.getId(), now, session.getPoints()) == 0) {
            return new CompleteSessionResponse(0, true, toResponse(session, attendance, now, false));
        }
        attendance.setCompletedAt(now);
        attendance.setPointsAwarded(session.getPoints());
        User user = userService.requireSelf(userId);
        taskSubmissionService.creditPoints(user, session.getPoints());
        return new CompleteSessionResponse(session.getPoints(), false, toResponse(session, attendance, now, false));
    }

    // ------------------------------------------------------------------ admin

    @Transactional(readOnly = true)
    public List<SessionResponse> adminList(UUID interestId) {
        List<MentorSession> sessions = interestId == null
            ? sessionRepository.findAllByOrderByScheduledAtDesc()
            : sessionRepository.findByInterestIdOrderByScheduledAtDesc(interestId);
        Instant now = Instant.now();
        return sessions.stream().map(s -> toResponse(s, null, now, true)).toList();
    }

    @Transactional
    public SessionResponse create(SaveSessionRequest request) {
        MentorSession session = new MentorSession();
        apply(session, request);
        return toResponse(sessionRepository.save(session), null, Instant.now(), true);
    }

    @Transactional
    public SessionResponse update(UUID sessionId, SaveSessionRequest request) {
        MentorSession session = sessionRepository.findById(sessionId).orElseThrow(() -> NotFoundException.of("Session"));
        apply(session, request);
        return toResponse(sessionRepository.save(session), null, Instant.now(), true);
    }

    /** Points already awarded for this session stay with the students who earned them. */
    @Transactional
    public void delete(UUID sessionId) {
        if (!sessionRepository.existsById(sessionId)) {
            throw NotFoundException.of("Session");
        }
        attendanceRepository.deleteBySessionId(sessionId);
        sessionRepository.deleteById(sessionId);
    }

    // ---------------------------------------------------------------- helpers

    static String parseYoutubeId(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        String trimmed = url.trim();
        if (BARE_ID.matcher(trimmed).matches()) {
            return trimmed;
        }
        Matcher m = YOUTUBE_URL.matcher(trimmed);
        if (!m.matches()) {
            throw new BadRequestException("That doesn't look like a YouTube video link");
        }
        return m.group(1);
    }

    private void apply(MentorSession session, SaveSessionRequest request) {
        Interest interest = interestRepository.findById(request.interestId())
            .orElseThrow(() -> NotFoundException.of("Interest"));
        session.setInterest(interest);
        session.setTitle(request.title().trim());
        session.setSpeakerName(trimToNull(request.speakerName()));
        session.setSpeakerRole(trimToNull(request.speakerRole()));
        session.setYoutubeVideoId(parseYoutubeId(request.youtubeUrl()));
        session.setScheduledAt(request.scheduledAt());
        session.setDurationMinutes(request.durationMinutes());
        session.setPoints(request.points());
    }

    private Set<UUID> interestIdsOf(UUID userId) {
        return selectionRepository.findAllWithInterestByUserId(userId).stream()
            .map(s -> s.getInterest().getId())
            .collect(Collectors.toSet());
    }

    /** 404 rather than 403 for sessions outside the caller's interests — they shouldn't learn it exists. */
    private MentorSession requireVisible(UUID userId, UUID sessionId) {
        MentorSession session = sessionRepository.findById(sessionId).orElseThrow(() -> NotFoundException.of("Session"));
        if (!interestIdsOf(userId).contains(session.getInterest().getId())) {
            throw NotFoundException.of("Session");
        }
        return session;
    }

    private SessionResponse toResponse(MentorSession s, SessionAttendance a, Instant now, boolean admin) {
        boolean available = s.isAvailable(now);
        return new SessionResponse(
            s.getId(),
            s.getInterest().getId(),
            s.getInterest().getName(),
            s.getTitle(),
            s.getSpeakerName(),
            s.getSpeakerRole(),
            available || admin ? s.getYoutubeVideoId() : null,
            s.getScheduledAt(),
            s.getDurationMinutes(),
            s.getPoints(),
            available ? "AVAILABLE" : "UPCOMING",
            attendanceRepository.countBySessionIdAndCompletedAtIsNotNull(s.getId()),
            a != null,
            a != null && a.getCompletedAt() != null
        );
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }
}
