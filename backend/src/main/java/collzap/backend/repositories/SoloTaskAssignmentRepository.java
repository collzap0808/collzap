package collzap.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import collzap.backend.models.SoloTaskAssignment;

public interface SoloTaskAssignmentRepository extends JpaRepository<SoloTaskAssignment, UUID> {

    /**
     * Days handed to this progress row, newest first; the first is the student's
     * current task. Ordered by when they were handed out, not day number, because
     * a student moved onto a replacement bank can start again at a lower day.
     */
    @Query("""
        select a from SoloTaskAssignment a join fetch a.taskBankItem
        where a.progress.id = :progressId order by a.assignedAt desc
        """)
    List<SoloTaskAssignment> findByProgressNewestFirst(@Param("progressId") UUID progressId);
}
