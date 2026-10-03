package collzap.backend.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/** One row = one student claimed one certificate. The name is saved here and never changes. */
@Entity
@Table(
        name = "certificate_issues",
        // One certificate per student per rule. This is also what stops a double-click
        // (or two tabs) from creating two rows with two different names.
        uniqueConstraints = @UniqueConstraint(name = "uq_certificate_rule_user", columnNames = {"rule_id", "user_id"}),
        indexes = {
                @Index(name = "idx_certificate_issues_rule", columnList = "rule_id"),
                @Index(name = "idx_certificate_issues_user", columnList = "user_id")
        })
@Getter
@Setter
@NoArgsConstructor
public class CertificateIssue {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID ruleId;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false, unique = true, length = 20)
    private String certificateCode;

    @Column(nullable = false, length = 80)
    private String holderName;

    @Column(length = 255)
    private String holderEmail;

    @Column(length = 200)
    private String collegeName;

    @Column(length = 60)
    private String level;

    @Column(nullable = false)
    private int pointsAtIssue;

    @Column(nullable = false)
    private int downloadCount;

    @Column(nullable = false, updatable = false)
    private Instant issuedAt;

    private Instant lastDownloadedAt;

    @PrePersist
    void onCreate() {
        if (issuedAt == null) issuedAt = Instant.now();
    }
}
