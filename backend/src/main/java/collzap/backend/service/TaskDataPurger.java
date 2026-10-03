package collzap.backend.service;

import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * Removes everything the daily-task, session and solo-task features keep about
 * one user, deepest rows first, so {@link UserService#deleteAccount} can delete
 * the user row without hitting a foreign key. Bulk JPQL deletes: one statement
 * per table, no matter how much history the user has.
 *
 * <p>Any new table with a foreign key to users needs a line here (or in
 * deleteAccount), or deleting a user who has rows in it will fail.
 */
@Component
public class TaskDataPurger {

    @PersistenceContext
    private EntityManager em;

    @Transactional(propagation = Propagation.MANDATORY)
    public void purge(UUID userId) {
        // Solo tasks: submissions → assignments → progress.
        run("delete from SoloTaskSubmission s where s.user.id = :u", userId);
        run("delete from SoloTaskAssignment a where a.user.id = :u", userId);
        run("delete from SoloTaskProgress p where p.user.id = :u", userId);

        // Group tasks: reviews they wrote, and reviews others wrote of their work,
        // before their submissions. Other members' submissions and the group's
        // assignments stay — they belong to the group, not to this user.
        run("delete from TaskReview r where r.reviewer.id = :u "
            + "or r.submission.id in (select s.id from TaskSubmission s where s.user.id = :u)", userId);
        run("delete from TaskSubmission s where s.user.id = :u", userId);

        // Mentoring sessions watched, and points / streak / unlock state.
        run("delete from SessionAttendance a where a.user.id = :u", userId);
        run("delete from UserTaskStats s where s.user.id = :u", userId);
    }

    private void run(String jpql, UUID userId) {
        em.createQuery(jpql).setParameter("u", userId).executeUpdate();
    }
}
