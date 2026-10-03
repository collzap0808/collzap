package collzap.backend.controller;

import java.util.Base64;
import java.util.List;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import collzap.backend.dto.CertificateDtos.CardView;
import collzap.backend.dto.CertificateDtos.DetailView;
import collzap.backend.dto.CertificateDtos.DownloadRequest;
import collzap.backend.dto.CertificateDtos.DownloadView;
import collzap.backend.dto.CertificateDtos.VerifyView;
import collzap.backend.ratelimit.RateLimited;
import collzap.backend.security.AuthPrincipal;
import collzap.backend.service.CertificateService;
import collzap.backend.service.CertificateService.PdfFile;

/**
 * Student side of certificates plus the public verify link the QR code opens.
 * Everything under /api/certificates needs a student login (SecurityConfig's
 * /api/** rule); /api/public/certificates/** is open to everyone.
 */
@RestController
@RequestMapping("/api")
public class CertificateController {

    private final CertificateService service;

    public CertificateController(CertificateService service) {
        this.service = service;
    }

    /** Home cards: LOCKED / UNLOCKED / ISSUED. */
    @GetMapping("/certificates")
    public List<CardView> mine(@AuthenticationPrincipal AuthPrincipal me) {
        return service.myCards(me.userId());
    }

    /** Certificate page. */
    @GetMapping("/certificates/{ruleId}")
    public DetailView detail(@AuthenticationPrincipal AuthPrincipal me, @PathVariable UUID ruleId) {
        return service.detail(me.userId(), ruleId);
    }

    /** First call saves the name for good. Later calls ignore the name and just download again. */
    @PostMapping("/certificates/{ruleId}/download")
    @RateLimited(name = "certificate-download", limit = 20, windowSeconds = 3600)
    public DownloadView download(@AuthenticationPrincipal AuthPrincipal me,
                                 @PathVariable UUID ruleId,
                                 @RequestBody(required = false) DownloadRequest body) {
        PdfFile f = service.download(me.userId(), ruleId, body == null ? null : body.name());
        return new DownloadView(f.filename(), Base64.getEncoder().encodeToString(f.bytes()),
                f.certificateCode(), f.holderName());
    }

    /** Public: the QR code on the certificate opens the page that calls this. */
    @GetMapping("/public/certificates/verify/{code}")
    @RateLimited(name = "certificate-verify", limit = 60, windowSeconds = 60, keyType = RateLimited.KeyType.IP)
    public VerifyView verify(@PathVariable String code) {
        return service.verify(code);
    }
}
