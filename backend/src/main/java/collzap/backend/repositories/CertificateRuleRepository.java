package collzap.backend.repositories;

import collzap.backend.models.CertificateRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CertificateRuleRepository extends JpaRepository<CertificateRule, UUID> {

    List<CertificateRule> findAllByOrderByCreatedAtDesc();

    List<CertificateRule> findByActiveTrueOrderByPointsRequiredAsc();
}
