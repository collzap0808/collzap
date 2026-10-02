package collzap.backend.repositories;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import collzap.backend.enums.SoloReviewStatus;
import collzap.backend.models.SoloTaskSubmission;

public interface SoloTaskSubmissionRepository extends JpaRepository<SoloTaskSubmission, UUID> {

    Optional<SoloTaskSubmission> findByAssignmentId(UUID assignmentId);

    /** The admin queue, oldest first, with everything the review card shows fetched in one go. */
    @Query("""
        select s from SoloTaskSubmission s
        join fetch s.user u left join fetch u.college
        join fetch s.assignment a join fetch a.taskBankItem join fetch a.progress p join fetch p.interest
        where s.status = :status order by s.submittedAt asc
        """)
    List<SoloTaskSubmission> findQueue(@Param("status") SoloReviewStatus status, Pageable page);

    @Query("""
        select s from SoloTaskSubmission s
        join fetch s.user u left join fetch u.college
        join fetch s.assignment a join fetch a.taskBankItem join fetch a.progress p join fetch p.interest
        where s.id = :id
        """)
    Optional<SoloTaskSubmission> findForReview(@Param("id") UUID id);

    long countByStatus(SoloReviewStatus status);

    long countByUserId(UUID userId);

    @Query("""
        select s from SoloTaskSubmission s join fetch s.assignment a join fetch a.taskBankItem
        where s.user.id = :userId order by s.submittedAt desc
        """)
    List<SoloTaskSubmission> findLatestByUser(@Param("userId") UUID userId, Pageable page);

    @Query("select s.submittedAt from SoloTaskSubmission s where s.user.id = :userId and s.submittedAt >= :from and s.submittedAt < :to")
    List<Instant> findSubmittedAtByUserBetween(@Param("userId") UUID userId, @Param("from") Instant from, @Param("to") Instant to);
}
