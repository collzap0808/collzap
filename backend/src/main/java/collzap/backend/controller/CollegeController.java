package collzap.backend.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import collzap.backend.dto.CollegeDtos.CollegeResponse;
import collzap.backend.service.CollegeService;

/**
 * Public college directory. Open without a token because the signup screen needs
 * the list before an account exists; creating colleges is an admin action and
 * lives on {@code /api/admin/colleges}.
 */
@RestController
@RequestMapping("/api/colleges")
public class CollegeController {

    private final CollegeService collegeService;

    public CollegeController(CollegeService collegeService) {
        this.collegeService = collegeService;
    }

    @GetMapping
    public List<CollegeResponse> list() {
        return collegeService.listAll();
    }

    /** Type-ahead for the college picker: name, city or domain, every word must match. */
    @GetMapping("/search")
    public List<CollegeResponse> search(
        @RequestParam(defaultValue = "") String q,
        @RequestParam(defaultValue = "20") int limit
    ) {
        return collegeService.search(q, limit);
    }

    @GetMapping("/{collegeId}")
    public CollegeResponse get(@PathVariable UUID collegeId) {
        return CollegeService.toResponse(collegeService.getById(collegeId));
    }
}
