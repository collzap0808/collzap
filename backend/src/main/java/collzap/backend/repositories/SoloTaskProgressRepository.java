package collzap.backend.repositories;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import collzap.backend.models.SoloTaskProgress;

public interface SoloTaskProgressRepository extends JpaRepository<SoloTaskProgress, UUID> {

    Optional<SoloTaskProgress> findByUserIdAndInterestId(UUID userId, UUID interestId);

    /** Running progress rows that haven't been handed today's day yet: the nightly sweep's work list. */
    @Query("""
        select p from SoloTaskProgress p
        where p.completedAt is null and (p.lastAssignedDate is null or p.lastAssignedDate < :today)
        """)
    List<SoloTaskProgress> findTickable(@Param("today") LocalDate today);
}
