package collzap.backend.repositories;

import collzap.backend.models.CertificateIssue;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CertificateIssueRepository extends JpaRepository<CertificateIssue, UUID> {

    Optional<CertificateIssue> findByRuleIdAndUserId(UUID ruleId, UUID userId);

    List<CertificateIssue> findByUserId(UUID userId);

    Optional<CertificateIssue> findByCertificateCode(String certificateCode);

    boolean existsByRuleId(UUID ruleId);

    boolean existsByCertificateCode(String certificateCode);

    Page<CertificateIssue> findByRuleIdOrderByIssuedAtDesc(UUID ruleId, Pageable pageable);

    /** rows: [ruleId, claimedStudents, totalDownloads] */
    @Query("select i.ruleId, count(i), coalesce(sum(i.downloadCount), 0) from CertificateIssue i group by i.ruleId")
    List<Object[]> statsByRule();

    @Transactional
    @Modifying
    @Query("update CertificateIssue i set i.downloadCount = i.downloadCount + 1, i.lastDownloadedAt = :now where i.id = :id")
    int recordDownload(@Param("id") UUID id, @Param("now") Instant now);
}
