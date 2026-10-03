package collzap.backend.controller;

import collzap.backend.dto.CertificateDtos.IssuePage;
import collzap.backend.dto.CertificateDtos.PreviewView;
import collzap.backend.dto.CertificateDtos.RuleAdminView;
import collzap.backend.service.CertificateAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/** Admin only. Make sure your SecurityConfig protects /api/admin/** for admins (it probably already does). */
@RestController
@RequestMapping("/api/admin/certificates")
@RequiredArgsConstructor
public class AdminCertificateController {

    private final CertificateAdminService service;

    @GetMapping
    public List<RuleAdminView> list() {
        return service.list();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public RuleAdminView create(@RequestParam String name,
                                @RequestParam int pointsRequired,
                                @RequestParam(required = false) String level,
                                @RequestParam(defaultValue = "true") boolean active,
                                @RequestPart("template") MultipartFile template) {
        return service.create(name, pointsRequired, level, active, template);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public RuleAdminView update(@PathVariable UUID id,
                                @RequestParam String name,
                                @RequestParam int pointsRequired,
                                @RequestParam(required = false) String level,
                                @RequestParam(defaultValue = "true") boolean active,
                                @RequestPart(value = "template", required = false) MultipartFile template) {
        return service.update(id, name, pointsRequired, level, active, template);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/preview")
    public PreviewView preview(@PathVariable UUID id) {
        return service.preview(id);
    }

    /** "Who claimed": name, email, college, unique number, downloads. */
    @GetMapping("/{id}/issues")
    public IssuePage issues(@PathVariable UUID id,
                            @RequestParam(defaultValue = "0") int page,
                            @RequestParam(defaultValue = "20") int size) {
        return service.issues(id, page, size);
    }
}
