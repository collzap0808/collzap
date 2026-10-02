package collzap.backend.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import collzap.backend.models.MatchMember;

public interface MatchMemberRepository extends JpaRepository<MatchMember, UUID> {

    @Query("""
        select m from MatchMember m
        join fetch m.matchGroup g
        join fetch g.interest
        join fetch g.college
        where m.user.id = :userId and m.active = true
        order by m.joinedAt desc
        """)
    List<MatchMember> findActiveWithGroupByUserId(@Param("userId") UUID userId);

    @Query("""
        select m from MatchMember m
        join fetch m.user u
        join fetch u.college
        where m.matchGroup.id = :groupId and m.active = true
        order by m.joinedAt asc
        """)
    List<MatchMember> findActiveWithUserByGroupId(@Param("groupId") UUID groupId);

    @Query("""
        select m from MatchMember m
        join fetch m.user u
        join fetch u.college
        where m.matchGroup.id in :groupIds and m.active = true
        """)
    List<MatchMember> findActiveWithUserByGroupIdIn(@Param("groupIds") List<UUID> groupIds);

    Optional<MatchMember> findByMatchGroupIdAndUserId(UUID matchGroupId, UUID userId);

    boolean existsByMatchGroupIdAndUserIdAndActiveTrue(UUID matchGroupId, UUID userId);

    long countByMatchGroupIdAndActiveTrue(UUID matchGroupId);

    /** Has this user ever been in a match group (active or not)? Grandfathers pre-lock users. */
    boolean existsByUserId(UUID userId);

    @Query("select m.user.id from MatchMember m where m.matchGroup.id = :groupId and m.active = true")
    List<UUID> findActiveUserIdsByGroupId(@Param("groupId") UUID groupId);

    void deleteByUserId(UUID userId);
}
