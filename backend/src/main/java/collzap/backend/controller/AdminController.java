package collzap.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import collzap.backend.dto.AdminDtos.AdminMatchRow;
import collzap.backend.dto.AdminDtos.AdminQueueRow;
import collzap.backend.dto.AdminDtos.AdminReportRow;
import collzap.backend.dto.AdminDtos.AdminStatsResponse;
import collzap.backend.dto.AdminDtos.AdminUserRow;
import collzap.backend.dto.AdminDtos.CreateMatchRequest;
import collzap.backend.dto.AdminDtos.InterestFeedbackRow;
import collzap.backend.dto.AdminDtos.LandingAnalyticsResponse;
import collzap.backend.dto.AdminDtos.PendingVerificationRow;
import collzap.backend.dto.AdminDtos.UnmatchRequest;
import collzap.backend.dto.CollegeDtos.CollegeResponse;
import collzap.backend.dto.CollegeDtos.CreateCollegeRequest;
import collzap.backend.dto.CollegeDtos.ReviewDocumentRequest;
import collzap.backend.dto.CollegeDtos.VerificationDocumentResponse;
import collzap.backend.dto.CommonDtos.MessageResponse;
import collzap.backend.dto.CommonDtos.PageResponse;
import collzap.backend.dto.MatchDtos.MatchGroupResponse;
import collzap.backend.dto.UserDtos.UserResponse;
import collzap.backend.enums.MatchGroupStatus;
import collzap.backend.enums.Status;
import collzap.backend.security.AuthPrincipal;
import collzap.backend.service.AdminService;
import collzap.backend.service.CollegeService;
import collzap.backend.service.LandingAnalyticsService;
import jakarta.validation.Valid;

/**
 * The {@code /admin} dashboard API. The whole prefix requires ROLE_ADMIN, which
 * only the operator login issues, so none of these need their own guard.
 *
 * <p>
 * Every mutation delegates to the service that owns the rule rather than
 * writing
 * rows directly — an operator approving a document or forcing a match triggers
 * the
 * same emails, notifications and capacity checks as the normal flow.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;
    private final CollegeService collegeService;
    private final LandingAnalyticsService landingAnalyticsService;

    public AdminController(AdminService adminService, CollegeService collegeService,
            LandingAnalyticsService landingAnalyticsService) {
        this.adminService = adminService;
        this.collegeService = collegeService;
        this.landingAnalyticsService = landingAnalyticsService;
    }

    /** Dashboard tiles. */
    @GetMapping("/stats")
    public AdminStatsResponse stats() {
        return adminService.stats();
    }

    /** Landing-page visitors per day from Google Analytics, for the last {@code days} days. */
    @GetMapping("/analytics/landing")
    public LandingAnalyticsResponse landingAnalytics(@RequestParam(defaultValue = "30") int days) {
        return landingAnalyticsService.landingVisits(days);
    }

    /**
     * The all-users table. {@code search} matches name or email; {@code status}
     * defaults to active accounts but accepts DELETED so support can look up a
     * closed account.
     */
    @GetMapping("/users")
    public PageResponse<AdminUserRow> users(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Status status,
            @PageableDefault(size = 25) Pageable pageable) {
        return adminService.users(search, status, pageable);
    }

    @GetMapping("/users/{userId}")
    public UserResponse user(@PathVariable UUID userId) {
        return adminService.user(userId);
    }

    /**
     * Permanent hard delete — everything the user ever created goes with them.
     * A reason is required; it's logged against the operator, not stored on the
     * (now-deleted) user.
     */
    @PostMapping("/users/{userId}/delete")
    public MessageResponse deleteUser(
            @AuthenticationPrincipal AuthPrincipal operator,
            @PathVariable UUID userId,
            @Valid @RequestBody collzap.backend.dto.AdminDtos.DeleteUserRequest request) {
        adminService.deleteUser(userId, operator.userId(), request);
        return MessageResponse.of("User deleted");
    }

    /** The verification queue, oldest first. */
    @GetMapping("/verifications")
    public PageResponse<PendingVerificationRow> pendingVerifications(
            @PageableDefault(size = 25) Pageable pageable) {
        return adminService.pendingVerifications(pageable);
    }

    /**
     * Approve or reject one document. Approving flips the user to verified and
     * opens
     * matching; rejecting records the note and tells the user why.
     */
    @PostMapping("/verifications/{documentId}/review")
    public VerificationDocumentResponse review(
            @AuthenticationPrincipal AuthPrincipal operator,
            @PathVariable UUID documentId,
            @Valid @RequestBody ReviewDocumentRequest request) {
        return adminService.review(documentId, request, operator.userId());
    }

    /** "Bring CollZap to my college" applications, optionally narrowed to one status. */
    @GetMapping("/college-applications")
    public PageResponse<collzap.backend.dto.CollegeApplicationDtos.AdminCollegeApplicationRow> collegeApplications(
            @RequestParam(required = false) collzap.backend.enums.DocumentStatus status,
            @PageableDefault(size = 25) Pageable pageable) {
        return adminService.collegeApplications(status, pageable);
    }

    /** Approve or reject one college application. Does not create a User or a College row. */
    @PostMapping("/college-applications/{applicationId}/review")
    public collzap.backend.dto.CollegeApplicationDtos.AdminCollegeApplicationRow reviewCollegeApplication(
            @AuthenticationPrincipal AuthPrincipal operator,
            @PathVariable UUID applicationId,
            @Valid @RequestBody ReviewDocumentRequest request) {
        return adminService.reviewCollegeApplication(applicationId, request, operator.userId());
    }

    /** The matches table, optionally narrowed to one status. */
    @GetMapping("/matches")
    public PageResponse<AdminMatchRow> matches(
            @RequestParam(required = false) MatchGroupStatus status,
            @PageableDefault(size = 25) Pageable pageable) {
        return adminService.matches(status, pageable);
    }

    /**
     * Everyone still waiting, longest wait first, with how long they have waited.
     */
    @GetMapping("/queue")
    public List<AdminQueueRow> queue() {
        return adminService.waitingQueue();
    }

    /** Force a match between two to four users of the same college. */
    @PostMapping("/matches")
    public ResponseEntity<MatchGroupResponse> createMatch(@Valid @RequestBody CreateMatchRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createMatch(request));
    }

    /** Remove one member, or omit {@code userId} to dissolve the group. */
    @PostMapping("/matches/unmatch")
    public MessageResponse unmatch(@Valid @RequestBody UnmatchRequest request) {
        adminService.unmatch(request);
        return MessageResponse.of(request.userId() == null ? "Group dissolved" : "Member removed");
    }

    @GetMapping("/reports")
    public PageResponse<AdminReportRow> reports(@PageableDefault(size = 25) Pageable pageable) {
        return adminService.reports(pageable);
    }

    /** "Can't find your interest" submissions, for deciding what to add next. */
    @GetMapping("/interest-feedback")
    public PageResponse<InterestFeedbackRow> interestFeedback(
            @PageableDefault(size = 25) Pageable pageable) {
        return adminService.interestFeedback(pageable);
    }

    /**
     * Registers a college and its email domain. Signup keys off the domain, so this
     * is what lets a new campus in.
     */
    /** Every college, searchable by name, city or domain, paginated. */
    @GetMapping("/colleges")
    public PageResponse<CollegeResponse> colleges(
            @RequestParam(required = false) String q,
            @PageableDefault(size = 25) Pageable pageable) {
        return collegeService.adminPage(q, pageable);
    }

    @PostMapping("/colleges")
    public ResponseEntity<CollegeResponse> createCollege(@Valid @RequestBody CreateCollegeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(collegeService.create(request));
    }

    @PostMapping("/colleges/{id}")
    public CollegeResponse updateCollege(
            @PathVariable UUID id,
            @Valid @RequestBody collzap.backend.dto.CollegeDtos.UpdateCollegeRequest request) {
        return collegeService.update(id, request);
    }

    @PostMapping("/colleges/{id}/delete")
    public MessageResponse deleteCollege(@PathVariable UUID id) {
        collegeService.delete(id);
        return MessageResponse.of("College deleted");
    }

    @GetMapping("/interests")
    public List<collzap.backend.dto.InterestDtos.InterestResponse> allInterests() {
        return adminService.allInterests();
    }

    @PostMapping("/interests")
    public ResponseEntity<collzap.backend.dto.InterestDtos.InterestResponse> createInterest(
            @Valid @RequestBody collzap.backend.dto.InterestDtos.CreateInterestRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createInterest(request));
    }

    @PostMapping("/interests/{id}")
    public collzap.backend.dto.InterestDtos.InterestResponse updateInterest(
            @PathVariable UUID id,
            @Valid @RequestBody collzap.backend.dto.InterestDtos.UpdateInterestRequest request) {
        return adminService.updateInterest(id, request);
    }

    @PostMapping("/interests/{id}/delete")
    public MessageResponse deleteInterest(@PathVariable UUID id) {
        adminService.deleteInterest(id);
        return MessageResponse.of("Interest deleted");
    }

    /** Questions management */
    @GetMapping("/questions")
    public PageResponse<collzap.backend.dto.AdminDtos.AdminQuestionResponse> questions(
            @RequestParam(required = false) UUID interestId,
            @PageableDefault(size = 50) Pageable pageable) {
        return adminService.questions(interestId, pageable);
    }

    @PostMapping("/questions")
    public ResponseEntity<collzap.backend.dto.AdminDtos.AdminQuestionResponse> createQuestion(
            @Valid @RequestBody collzap.backend.dto.AdminDtos.QuestionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createQuestion(request));
    }

    @PostMapping("/questions/{id}")
    public collzap.backend.dto.AdminDtos.AdminQuestionResponse updateQuestion(
            @PathVariable UUID id,
            @Valid @RequestBody collzap.backend.dto.AdminDtos.QuestionRequest request) {
        return adminService.updateQuestion(id, request);
    }

    @PostMapping("/questions/delete-all")
    public MessageResponse deleteAllQuestions() {
        long count = adminService.deleteAllQuestions();
        return MessageResponse.of("Deleted " + count + " question(s)");
    }

    @PostMapping("/questions/{id}/delete")
    public MessageResponse deleteQuestion(@PathVariable UUID id) {
        adminService.deleteQuestion(id);
        return MessageResponse.of("Question deleted");
    }
}
