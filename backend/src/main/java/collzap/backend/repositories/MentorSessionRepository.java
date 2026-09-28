package collzap.backend.repositories;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import collzap.backend.models.MentorSession;

public interface MentorSessionRepository extends JpaRepository<MentorSession, UUID> {

    @EntityGraph(attributePaths = "interest")
    List<MentorSession> findByInterestIdInOrderByScheduledAtDesc(Collection<UUID> interestIds);

    @EntityGraph(attributePaths = "interest")
    List<MentorSession> findAllByOrderByScheduledAtDesc();

    @EntityGraph(attributePaths = "interest")
    List<MentorSession> findByInterestIdOrderByScheduledAtDesc(UUID interestId);
}
