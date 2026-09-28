package collzap.backend.repositories;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import collzap.backend.models.SessionAttendance;

public interface SessionAttendanceRepository extends JpaRepository<SessionAttendance, UUID> {

    Optional<SessionAttendance> findBySessionIdAndUserId(UUID sessionId, UUID userId);

    List<SessionAttendance> findByUserIdAndSessionIdIn(UUID userId, Collection<UUID> sessionIds);

    long countByUserIdAndCompletedAtIsNotNull(UUID userId);

    long countBySessionIdAndCompletedAtIsNotNull(UUID sessionId);

    @EntityGraph(attributePaths = "session")
    List<SessionAttendance> findTop3ByUserIdAndCompletedAtIsNotNullOrderByCompletedAtDesc(UUID userId);

    /** Returns 1 only for the call that actually marks it complete, so points are never awarded twice. */
    @Modifying
    @Query("""
        update SessionAttendance a set a.completedAt = :now, a.pointsAwarded = :points
        where a.id = :id and a.completedAt is null
        """)
    int markCompleted(@Param("id") UUID id, @Param("now") Instant now, @Param("points") int points);

    @Modifying
    @Query("delete from SessionAttendance a where a.session.id = :sessionId")
    void deleteBySessionId(@Param("sessionId") UUID sessionId);
}
