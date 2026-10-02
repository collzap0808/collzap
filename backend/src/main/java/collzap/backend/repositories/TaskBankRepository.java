package collzap.backend.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import collzap.backend.models.TaskBank;

public interface TaskBankRepository extends JpaRepository<TaskBank, UUID> {

    /** The interest's live bank for matched groups (legacy banks with no track count as GROUP). */
    @Query("select b from TaskBank b where b.interest.id = :interestId and b.active = true and (b.track is null or b.track = collzap.backend.enums.TaskTrack.GROUP)")
    Optional<TaskBank> findActiveGroupBank(@Param("interestId") UUID interestId);

    /** The interest's live bank for students who haven't unlocked matching yet. */
    @Query("select b from TaskBank b where b.interest.id = :interestId and b.active = true and b.track = collzap.backend.enums.TaskTrack.SOLO")
    Optional<TaskBank> findActiveSoloBank(@Param("interestId") UUID interestId);

    @Query("select b from TaskBank b join fetch b.interest where b.interest.id = :interestId order by b.createdAt desc")
    List<TaskBank> findAllByInterestIdOrderByCreatedAtDesc(@Param("interestId") UUID interestId);

    @Query("select b from TaskBank b join fetch b.interest order by b.createdAt desc")
    List<TaskBank> findAllWithInterest();
}
