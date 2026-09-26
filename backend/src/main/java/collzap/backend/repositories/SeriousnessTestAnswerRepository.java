package collzap.backend.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import collzap.backend.models.SeriousnessTestAnswer;

public interface SeriousnessTestAnswerRepository extends JpaRepository<SeriousnessTestAnswer, UUID> {

    Optional<SeriousnessTestAnswer> findByAttemptIdAndQuestionId(UUID attemptId, UUID questionId);

    List<SeriousnessTestAnswer> findByAttemptId(UUID attemptId);

    @Query("select coalesce(sum(a.pointsEarned), 0) from SeriousnessTestAnswer a where a.attempt.id = :attemptId")
    int sumPointsEarnedByAttemptId(@Param("attemptId") UUID attemptId);

    /**
     * Atomic insert-or-update on the (attempt, question) unique key. A check-then-insert
     * race can't be recovered in-transaction on Postgres — the failed insert aborts the
     * whole transaction — so the conflict has to be resolved inside the statement.
     */
    @Modifying
    @Query(value = """
        insert into seriousness_test_answers
            (id, attempt_id, question_id, selected_option_index, points_earned, created_at)
        values (:id, :attemptId, :questionId, :selectedOptionIndex, :pointsEarned, now())
        on conflict (attempt_id, question_id)
        do update set selected_option_index = excluded.selected_option_index,
                      points_earned = excluded.points_earned
        """, nativeQuery = true)
    void upsert(
        @Param("id") UUID id,
        @Param("attemptId") UUID attemptId,
        @Param("questionId") UUID questionId,
        @Param("selectedOptionIndex") int selectedOptionIndex,
        @Param("pointsEarned") int pointsEarned
    );


    @Modifying
    @Query("delete from SeriousnessTestAnswer a where a.attempt.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query("delete from SeriousnessTestAnswer a where a.question.interest.id = :interestId")
    void deleteByQuestionInterestId(@Param("interestId") UUID interestId);
}
