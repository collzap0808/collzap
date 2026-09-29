package collzap.backend.controller;

import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import collzap.backend.exception.BadRequestException;
import collzap.backend.ratelimit.RateLimited;
import collzap.backend.security.AuthPrincipal;
import collzap.backend.service.DocumentUploadService;

/**
 * General-purpose file upload endpoint for signed-in users. The client sends a
 * file and a category (DOCUMENT or PROFILE_PHOTO); the controller validates the
 * file, uploads it to Cloudinary, and returns the resulting URL.
 *
 * Kept behind ROLE_USER deliberately — the public college-application upload
 * (CollegeApplicationController) is a separate, IP-rate-limited endpoint with
 * its own fixed folder, so an anonymous visitor can never write into arbitrary
 * categories here.
 */
@RestController
@RequestMapping("/api/upload")
public class UploadController {

    private static final Map<String, String> CATEGORY_FOLDERS = Map.of(
        "DOCUMENT", "collzap/documents",
        "PROFILE_PHOTO", "collzap/profile-photos",
        "TASK_SUBMISSION", "collzap/task-submissions",
        "CHAT_ATTACHMENT", "collzap/chat-attachments"
    );

    private final DocumentUploadService documentUploadService;

    public UploadController(DocumentUploadService documentUploadService) {
        this.documentUploadService = documentUploadService;
    }

    @RateLimited(name = "file-upload", limit = 20, windowSeconds = 3600)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> upload(
        @AuthenticationPrincipal AuthPrincipal me,
        @RequestParam("file") MultipartFile file,
        @RequestParam("category") String category
    ) {
        String upperCategory = category.toUpperCase();
        String folder = CATEGORY_FOLDERS.get(upperCategory);
        if (folder == null) {
            throw new BadRequestException("Invalid category. Must be DOCUMENT, PROFILE_PHOTO, TASK_SUBMISSION or CHAT_ATTACHMENT");
        }
        // Chat attachments share the task policy: images or a PDF, up to 10 MB.
        var policy = upperCategory.equals("TASK_SUBMISSION") || upperCategory.equals("CHAT_ATTACHMENT")
            ? DocumentUploadService.TASK_SUBMISSION_10MB
            : DocumentUploadService.IMAGE_5MB;
        String url = documentUploadService.validateAndUpload(file, folder, policy);
        return ResponseEntity.ok(Map.of("url", url));
    }
}
