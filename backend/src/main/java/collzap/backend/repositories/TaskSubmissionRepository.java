package collzap.backend.repositories;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import collzap.backend.models.TaskSubmission;

public interface TaskSubmissionRepository extends JpaRepository<TaskSubmission, UUID> {

    @Query("""
        select s from TaskSubmission s
        join fetch s.user
        where s.taskAssignment.id = :assignmentId
        order by s.submittedAt asc
        """)
    List<TaskSubmission> findByAssignmentId(@Param("assignmentId") UUID assignmentId);

    Optional<TaskSubmission> findByTaskAssignmentIdAndUserId(UUID assignmentId, UUID userId);

    @Query("select s from TaskSubmission s join fetch s.user join fetch s.taskAssignment where s.id = :id")
    Optional<TaskSubmission> findWithUserAndAssignmentById(@Param("id") UUID id);

    long countByUserId(UUID userId);

    @Query("select s.submittedAt from TaskSubmission s where s.user.id = :userId")
    List<Instant> findSubmittedAtByUserId(@Param("userId") UUID userId);

    @EntityGraph(attributePaths = {"taskAssignment", "taskAssignment.taskBankItem"})
    List<TaskSubmission> findTop3ByUserIdOrderBySubmittedAtDesc(UUID userId);

    @Query("""
        select s.submittedAt from TaskSubmission s
        where s.user.id = :userId and s.submittedAt >= :from and s.submittedAt < :to
        """)
    List<Instant> findSubmittedAtByUserBetween(
        @Param("userId") UUID userId,
        @Param("from") Instant from,
        @Param("to") Instant to
    );
}
