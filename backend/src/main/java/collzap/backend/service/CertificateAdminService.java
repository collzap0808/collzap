package collzap.backend.service;

import collzap.backend.dto.CertificateDtos.IssuePage;
import collzap.backend.dto.CertificateDtos.IssueRow;
import collzap.backend.dto.CertificateDtos.PreviewView;
import collzap.backend.dto.CertificateDtos.RuleAdminView;
import collzap.backend.exception.BadRequestException;
import collzap.backend.exception.ConflictException;
import collzap.backend.exception.NotFoundException;
import collzap.backend.models.CertificateIssue;
import collzap.backend.models.CertificateRule;
import collzap.backend.repositories.CertificateIssueRepository;
import collzap.backend.repositories.CertificateRuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CertificateAdminService {

    private static final long MAX_TEMPLATE_BYTES = 1_000_000;
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd MMMM yyyy", Locale.ENGLISH);

    private final CertificateRuleRepository rules;
    private final CertificateIssueRepository issues;
    private final CertificatePointsService points;
    private final CertificateRenderer renderer;

    @Transactional(readOnly = true)
    public List<RuleAdminView> list() {
        Map<UUID, long[]> stats = new HashMap<>();
        for (Object[] row : issues.statsByRule()) {
            stats.put((UUID) row[0], new long[] {((Number) row[1]).longValue(), ((Number) row[2]).longValue()});
        }
        return rules.findAllByOrderByCreatedAtDesc().stream()
                .map(r -> view(r, stats.getOrDefault(r.getId(), new long[2])))
                .toList();
    }

    @Transactional
    public RuleAdminView create(String name, int pointsRequired, String level, boolean active, MultipartFile template) {
        CertificateRule r = new CertificateRule();
        apply(r, name, pointsRequired, level, active);
        if (template == null || template.isEmpty()) {
            throw new BadRequestException("Please upload the certificate HTML file");
        }
        setTemplate(r, template);
        return view(rules.save(r), new long[2]);
    }

    @Transactional
    public RuleAdminView update(UUID id, String name, int pointsRequired, String level, boolean active,
                                MultipartFile template) {
        CertificateRule r = find(id);
        apply(r, name, pointsRequired, level, active);
        if (template != null && !template.isEmpty()) {
            setTemplate(r, template);
        }
        r = rules.save(r);
        long claimed = 0, downloads = 0;
        for (Object[] row : issues.statsByRule()) {
            if (id.equals(row[0])) {
                claimed = ((Number) row[1]).longValue();
                downloads = ((Number) row[2]).longValue();
            }
        }
        return view(r, new long[] {claimed, downloads});
    }

    @Transactional
    public void delete(UUID id) {
        CertificateRule r = find(id);
        if (issues.existsByRuleId(id)) {
            throw new ConflictException("Students already claimed this certificate. Turn it off instead of deleting.");
        }
        rules.delete(r);
    }

    @Transactional(readOnly = true)
    public PreviewView preview(UUID id) {
        CertificateRule r = find(id);
        Map<String, String> v = renderer.values(
                "Student Name", "Your College Name", "CZ-SAMPLE", r.getLevel(),
                r.getPointsRequired(), LocalDate.now(ZoneId.of("Asia/Kolkata")).format(DATE), r.getName());
        return new PreviewView(renderer.fill(r.getTemplateHtml(), v));
    }

    @Transactional(readOnly = true)
    public IssuePage issues(UUID ruleId, int page, int size) {
        find(ruleId);
        int safeSize = Math.min(Math.max(size, 1), 100);
        Page<CertificateIssue> p = issues.findByRuleIdOrderByIssuedAtDesc(ruleId, PageRequest.of(Math.max(page, 0), safeSize));
        List<IssueRow> rows = p.getContent().stream()
                .map(i -> new IssueRow(i.getId(), i.getCertificateCode(), i.getHolderName(), i.getHolderEmail(),
                        i.getCollegeName(), i.getPointsAtIssue(), i.getIssuedAt(), i.getDownloadCount(),
                        i.getLastDownloadedAt()))
                .toList();
        return new IssuePage(rows, p.getTotalElements(), p.getNumber(), p.getSize());
    }

    // ---------------------------------------------------------------- helpers

    private CertificateRule find(UUID id) {
        return rules.findById(id).orElseThrow(() -> new NotFoundException("Certificate not found"));
    }

    private void apply(CertificateRule r, String name, int pointsRequired, String level, boolean active) {
        String n = name == null ? "" : name.trim();
        if (n.isEmpty() || n.length() > 120) throw new BadRequestException("Name is required (max 120 letters)");
        if (pointsRequired < 1) throw new BadRequestException("Points must be 1 or more");
        String l = level == null ? null : level.trim();
        if (l != null && l.length() > 60) throw new BadRequestException("Level is too long (max 60 letters)");
        r.setName(n);
        r.setPointsRequired(pointsRequired);
        r.setLevel(l == null || l.isEmpty() ? null : l);
        r.setActive(active);
    }

    private void setTemplate(CertificateRule r, MultipartFile file) {
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("Could not read the uploaded file");
        }
        if (bytes.length == 0 || bytes.length > MAX_TEMPLATE_BYTES) {
            throw new BadRequestException("HTML file must be less than 1 MB");
        }
        String fn = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        if (!(fn.endsWith(".html") || fn.endsWith(".htm"))) {
            throw new BadRequestException("Please upload an .html file");
        }

        String html = new String(bytes, StandardCharsets.UTF_8);
        if (!html.contains("<")) throw new BadRequestException("This file does not look like HTML");

        r.setTemplateHtml(renderer.sanitize(html));
        String original = file.getOriginalFilename();
        r.setTemplateFileName(original == null ? null : original.substring(0, Math.min(original.length(), 200)));
    }

    private RuleAdminView view(CertificateRule r, long[] s) {
        return new RuleAdminView(r.getId(), r.getName(), r.getPointsRequired(), r.getLevel(), r.isActive(),
                r.getTemplateFileName(), r.getCreatedAt(),
                points.countAtLeast(r.getPointsRequired()), s[0], s[1]);
    }
}
