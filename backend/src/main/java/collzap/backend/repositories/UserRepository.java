package collzap.backend.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import collzap.backend.enums.Status;
import collzap.backend.enums.VerificationStatus;
import collzap.backend.models.User;

public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    Page<User> findByVerificationStatus(VerificationStatus status, Pageable pageable);

    Page<User> findByAccountStatus(Status accountStatus, Pageable pageable);

    @Query(
        value = """
            select u from User u
            left join fetch u.college c
            where (:accountStatus is null or u.accountStatus = :accountStatus)
              and (:verificationStatus is null or u.verificationStatus = :verificationStatus)
              and (:search is null or :search = ''
                   or lower(u.name) like lower(concat('%', :search, '%'))
                   or lower(u.email) like lower(concat('%', :search, '%'))
                   or lower(c.name) like lower(concat('%', :search, '%')))
            order by u.createdAt desc
            """,
        countQuery = """
            select count(u) from User u
            left join u.college c
            where (:accountStatus is null or u.accountStatus = :accountStatus)
              and (:verificationStatus is null or u.verificationStatus = :verificationStatus)
              and (:search is null or :search = ''
                   or lower(u.name) like lower(concat('%', :search, '%'))
                   or lower(u.email) like lower(concat('%', :search, '%'))
                   or lower(c.name) like lower(concat('%', :search, '%')))
            """
    )
    Page<User> searchActive(
        @Param("accountStatus") Status accountStatus,
        @Param("verificationStatus") VerificationStatus verificationStatus,
        @Param("search") String search,
        Pageable pageable
    );

    @Query("select u from User u join fetch u.college where u.id in :ids")
    List<User> findAllWithCollegeByIdIn(@Param("ids") List<UUID> ids);

    // Left join: college can legitimately be null between signup and verification —
    // an inner join here would silently 404 a brand-new user's own GET /api/me instead
    // of just returning them with a null college.
    @Query("select u from User u left join fetch u.college where u.id = :id")
    Optional<User> findWithCollegeById(@Param("id") UUID id);

    long countByVerificationStatus(VerificationStatus status);

    long countByCollegeId(UUID collegeId);
}
