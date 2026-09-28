package collzap.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import collzap.backend.models.TaskReview;

public interface TaskReviewRepository extends JpaRepository<TaskReview, UUID> {

    boolean existsBySubmissionIdAndReviewerId(UUID submissionId, UUID reviewerId);

    List<TaskReview> findBySubmissionId(UUID submissionId);

    long countByReviewerId(UUID reviewerId);

    @EntityGraph(attributePaths = {"submission", "submission.taskAssignment", "submission.taskAssignment.taskBankItem"})
    List<TaskReview> findTop3ByReviewerIdOrderByReviewedAtDesc(UUID reviewerId);
}
