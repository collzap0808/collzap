package collzap.backend.dto;

import collzap.backend.enums.CertificateStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class CertificateDtos {

    private CertificateDtos() {}

    // ---------- admin ----------
    public record RuleAdminView(
            UUID id, String name, int pointsRequired, String level, boolean active,
            String templateFileName, Instant createdAt,
            long unlockedCount,   // students who have enough points
            long claimedCount,    // students who downloaded at least once
            long totalDownloads) {}

    public record IssueRow(
            UUID id, String certificateCode, String holderName, String holderEmail,
            String collegeName, int points, Instant issuedAt, int downloadCount, Instant lastDownloadedAt) {}

    public record IssuePage(List<IssueRow> items, long total, int page, int size) {}

    public record PreviewView(String html) {}

    // ---------- student ----------
    public record CardView(
            UUID ruleId, String name, String level, int pointsRequired,
            long myPoints, long pointsToGo, CertificateStatus status, String certificateCode) {}

    /** previewHtml is null while LOCKED. While UNLOCKED it still contains {{studentName}} for live typing. */
    public record DetailView(CardView card, String holderName, String previewHtml) {}

    public record DownloadRequest(String name) {}

    /** The PDF travels as base64 JSON so the shared axios client (token refresh, error messages) just works. */
    public record DownloadView(String filename, String pdfBase64, String certificateCode, String holderName) {}

    // ---------- public ----------
    public record VerifyView(
            boolean valid, String code, String certificateName, String holderName,
            String collegeName, String level, Integer points, String issuedDate) {}
}
