package collzap.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import collzap.backend.enums.ProjectType;
import collzap.backend.models.UserInterestSelection;

public interface UserInterestSelectionRepository extends JpaRepository<UserInterestSelection, UUID> {

    @Query("""
        select s from UserInterestSelection s
        join fetch s.interest
        where s.user.id = :userId
        order by s.interest.displayOrder asc
        """)
    List<UserInterestSelection> findAllWithInterestByUserId(@Param("userId") UUID userId);

    @Query("""
        select s from UserInterestSelection s
        join fetch s.interest
        where s.user.id = :userId and s.projectType = :projectType
        order by s.interest.displayOrder asc
        """)
    List<UserInterestSelection> findAllWithInterestByUserIdAndProjectType(
        @Param("userId") UUID userId,
        @Param("projectType") ProjectType projectType
    );

    void deleteByUserIdAndProjectType(UUID userId, ProjectType projectType);

    void deleteByUserId(UUID userId);

    long countByUserIdAndProjectType(UUID userId, ProjectType projectType);

    long countByInterestId(UUID interestId);

    /**
     * Per interest: how many other verified, active students at one college
     * picked it. Rows are [interestId, interestName, category, count].
     */
    @Query("""
        select s.interest.id, s.interest.name, s.interest.category, count(distinct s.user.id)
        from UserInterestSelection s
        where s.user.college.id = :collegeId
          and s.user.id <> :userId
          and s.user.verificationStatus = collzap.backend.enums.VerificationStatus.APPROVED
          and s.user.accountStatus = collzap.backend.enums.Status.ACTIVE
          and s.interest.active = true
        group by s.interest.id, s.interest.name, s.interest.category
        order by count(distinct s.user.id) desc, s.interest.name asc
        """)
    List<Object[]> countCampusStudentsByInterest(@Param("collegeId") UUID collegeId, @Param("userId") UUID userId);
}
