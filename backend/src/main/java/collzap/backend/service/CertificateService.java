package collzap.backend.service;

import collzap.backend.dto.CertificateDtos.CardView;
import collzap.backend.dto.CertificateDtos.DetailView;
import collzap.backend.dto.CertificateDtos.VerifyView;
import collzap.backend.enums.CertificateStatus;
import collzap.backend.exception.BadRequestException;
import collzap.backend.exception.ForbiddenException;
import collzap.backend.exception.NotFoundException;
import collzap.backend.models.CertificateIssue;
import collzap.backend.models.CertificateRule;
import collzap.backend.repositories.CertificateIssueRepository;
import collzap.backend.repositories.CertificateRuleRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private static final Logger log = LoggerFactory.getLogger(CertificateService.class);
    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd MMMM yyyy", Locale.ENGLISH);
    // English letters only, because the PDF uses built-in fonts
    private static final Pattern NAME_OK = Pattern.compile("[A-Za-z][A-Za-z .'-]*");
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RNG = new SecureRandom();

    private final CertificateRuleRepository rules;
    private final CertificateIssueRepository issues;
    private final CertificatePointsService points;
    private final CertificateRenderer renderer;
    private final JdbcTemplate jdbc;
    private final TransactionTemplate tx;

    public record PdfFile(byte[] bytes, String filename, String certificateCode, String holderName) {}

    private record StudentInfo(String email, String college) {}

    // ------------------------------------------------------------ home cards

    public List<CardView> myCards(UUID userId) {
        long pts = points.pointsOf(userId);
        Map<UUID, CertificateIssue> mine = issues.findByUserId(userId).stream()
                .collect(Collectors.toMap(CertificateIssue::getRuleId, Function.identity()));
        List<CardView> out = new ArrayList<>();
        for (CertificateRule r : rules.findByActiveTrueOrderByPointsRequiredAsc()) {
            out.add(card(r, pts, mine.get(r.getId())));
        }
        return out;
    }

    // ------------------------------------------------------ certificate page

    /**
     * Data for the certificate page. LOCKED -> no preview. Otherwise the preview HTML is built
     * defensively: if the template or QR step ever fails, the page still opens (previewHtml = null),
     * the student can still type a name and download, and the real cause is written to the log.
     */
    @Transactional(readOnly = true)
    public DetailView detail(UUID userId, UUID ruleId) {
        CertificateRule rule = rules.findById(ruleId).orElseThrow(() -> new NotFoundException("Certificate not found"));
        CertificateIssue issue = issues.findByRuleIdAndUserId(ruleId, userId).orElse(null);
        if (issue == null && !rule.isActive()) throw new NotFoundException("Certificate not found");

        long pts = points.pointsOf(userId);
        CardView card = card(rule, pts, issue);
        if (card.status() == CertificateStatus.LOCKED) {
            return new DetailView(card, null, null);
        }

        String html = null;
        try {
            Map<String, String> values;
            if (issue != null) {
                values = valuesFor(rule, issue);
            } else {
                StudentInfo info = lookup(userId);
                values = renderer.values(null, info.college(), "CZ-PREVIEW", rule.getLevel(), pts,
                        DATE.format(Instant.now().atZone(IST)), rule.getName());
            }
            html = renderer.fill(rule.getTemplateHtml(), values);
        } catch (RuntimeException | LinkageError e) {
            log.error("Certificate preview failed (rule={}, user={}) - opening the page without a preview",
                    ruleId, userId, e);
        }
        return new DetailView(card, issue == null ? null : issue.getHolderName(), html);
    }

    // -------------------------------------------------------------- download

    /** First call saves the name forever. Later calls ignore the name and just download again. */
    public PdfFile download(UUID userId, UUID ruleId, String nameInput) {
        CertificateRule rule = rules.findById(ruleId).orElseThrow(() -> new NotFoundException("Certificate not found"));
        CertificateIssue issue = issues.findByRuleIdAndUserId(ruleId, userId).orElse(null);

        if (issue == null) {
            if (!rule.isActive()) throw new NotFoundException("Certificate not found");
            long pts = points.pointsOf(userId);                       // server checks, never trusts the client
            if (pts < rule.getPointsRequired()) throw new ForbiddenException("This certificate is still locked");

            String name = cleanName(nameInput);
            StudentInfo info = lookup(userId);

            CertificateIssue fresh = new CertificateIssue();
            fresh.setRuleId(ruleId);
            fresh.setUserId(userId);
            fresh.setCertificateCode(newCode());
            fresh.setHolderName(name);
            fresh.setHolderEmail(info.email());
            fresh.setCollegeName(info.college());
            fresh.setLevel(rule.getLevel());
            fresh.setPointsAtIssue((int) Math.min(pts, Integer.MAX_VALUE));
            try {
                issue = tx.execute(s -> issues.saveAndFlush(fresh));
            } catch (DataIntegrityViolationException e) {
                // double click / two tabs: the other request already created it
                issue = issues.findByRuleIdAndUserId(ruleId, userId).orElseThrow(() -> e);
            }
        }

        final CertificateIssue done = issue;
        byte[] pdf = renderer.pdf(renderer.fill(rule.getTemplateHtml(), valuesFor(rule, done)));
        issues.recordDownload(done.getId(), Instant.now());
        return new PdfFile(pdf, "Collzap-Certificate-" + done.getCertificateCode() + ".pdf",
                done.getCertificateCode(), done.getHolderName());
    }

    // ---------------------------------------------------------------- verify

    public VerifyView verify(String code) {
        String c = code == null ? "" : code.trim().toUpperCase(Locale.ROOT);
        return issues.findByCertificateCode(c)
                .map(i -> new VerifyView(true, i.getCertificateCode(),
                        rules.findById(i.getRuleId()).map(CertificateRule::getName).orElse("Certificate"),
                        i.getHolderName(), i.getCollegeName(), i.getLevel(), i.getPointsAtIssue(),
                        DATE.format(i.getIssuedAt().atZone(IST))))
                .orElse(new VerifyView(false, c, null, null, null, null, null, null));
    }

    // --------------------------------------------------------------- helpers

    private CardView card(CertificateRule r, long pts, CertificateIssue issue) {
        CertificateStatus st = issue != null ? CertificateStatus.ISSUED
                : pts >= r.getPointsRequired() ? CertificateStatus.UNLOCKED : CertificateStatus.LOCKED;
        return new CardView(r.getId(), r.getName(), r.getLevel(), r.getPointsRequired(), pts,
                Math.max(0, r.getPointsRequired() - pts), st,
                issue == null ? null : issue.getCertificateCode());
    }

    private Map<String, String> valuesFor(CertificateRule rule, CertificateIssue i) {
        return renderer.values(i.getHolderName(), i.getCollegeName(), i.getCertificateCode(), i.getLevel(),
                i.getPointsAtIssue(), DATE.format(i.getIssuedAt().atZone(IST)), rule.getName());
    }

    private String cleanName(String raw) {
        String n = raw == null ? "" : raw.trim().replaceAll("\\s+", " ");
        if (n.length() < 2 || n.length() > 60) throw new BadRequestException("Name must be 2 to 60 letters");
        if (!NAME_OK.matcher(n).matches()) {
            throw new BadRequestException("Use English letters, spaces, . ' - only");
        }
        return n;
    }

    private StudentInfo lookup(UUID userId) {
        List<StudentInfo> rows = jdbc.query(
                "SELECT u.email, c.name FROM users u LEFT JOIN colleges c ON c.id = u.college_id WHERE u.id = ?",
                (rs, n) -> new StudentInfo(rs.getString(1), rs.getString(2)), userId);
        if (rows.isEmpty()) throw new NotFoundException("Student not found");
        return rows.get(0);
    }

    private String newCode() {
        for (int t = 0; t < 10; t++) {
            StringBuilder sb = new StringBuilder("CZ-");
            for (int i = 0; i < 10; i++) {
                if (i == 5) sb.append('-');
                sb.append(ALPHABET.charAt(RNG.nextInt(ALPHABET.length())));
            }
            String code = sb.toString();
            if (!issues.existsByCertificateCode(code)) return code;
        }
        throw new IllegalStateException("Could not create a unique certificate number");
    }
}