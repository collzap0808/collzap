package collzap.backend.controller;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import collzap.backend.dto.CommonDtos.MessageResponse;
import collzap.backend.dto.InterestDtos.CampusInterestCount;
import collzap.backend.dto.InterestDtos.InterestCatalogResponse;
import collzap.backend.dto.InterestDtos.InterestFeedbackRequest;
import collzap.backend.dto.InterestDtos.SelectInterestsRequest;
import collzap.backend.dto.InterestDtos.UserInterestResponse;
import collzap.backend.ratelimit.RateLimited;
import collzap.backend.security.AuthPrincipal;
import collzap.backend.service.InterestService;
import jakarta.validation.Valid;

/**
 * Interest selection. The two grids are separate lists with separate caps — two
 * long-term interests, one short-term activity — and the catalog response carries
 * those caps so the live counter and the disabled state come from one source.
 */
@RestController
@RequestMapping("/api/interests")
public class InterestController {

    private final InterestService interestService;

    public InterestController(InterestService interestService) {
        this.interestService = interestService;
    }

    /** Both grids and both caps in one call. */
    @GetMapping("/catalog")
    public InterestCatalogResponse catalog() {
        return interestService.catalog();
    }

    /** Student counts per interest on the caller's campus, for Explore on Matches. */
    @GetMapping("/campus")
    public List<CampusInterestCount> campus(@AuthenticationPrincipal AuthPrincipal me) {
        return interestService.campusCounts(me.userId());
    }

    @GetMapping("/me")
    public List<UserInterestResponse> mine(@AuthenticationPrincipal AuthPrincipal me) {
        return interestService.interests(me.userId());
    }

    /**
     * Replaces the selection for one project type, so re-selecting is just another
     * PUT. Each item may carry an optional free-text sub-tag.
     */
    @PutMapping("/me")
    public List<UserInterestResponse> select(
        @AuthenticationPrincipal AuthPrincipal me,
        @Valid @RequestBody SelectInterestsRequest request
    ) {
        return interestService.selectInterests(me.userId(), request);
    }

    /** The "can't find your interest?" link. */
    @RateLimited(name = "interest-feedback", limit = 5, windowSeconds = 3600)
    @PostMapping("/feedback")
    public MessageResponse feedback(
        @AuthenticationPrincipal AuthPrincipal me,
        @Valid @RequestBody InterestFeedbackRequest request
    ) {
        interestService.submitFeedback(me.userId(), request);
        return MessageResponse.of("Thanks — we will take a look");
    }
}
