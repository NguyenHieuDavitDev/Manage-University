package com.managestudents.courseclass.repository;

import com.managestudents.courseclass.entity.CourseClassEnrollment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CourseClassEnrollmentRepository
        extends JpaRepository<CourseClassEnrollment, Long>, JpaSpecificationExecutor<CourseClassEnrollment> {

    boolean existsByUser_IdAndCourseClass_Id(UUID userId, Long courseClassId);

    long countByCourseClass_Id(Long courseClassId);

    void deleteByCourseClass_Id(Long courseClassId);

    List<CourseClassEnrollment> findByCourseClass_IdOrderByEnrolledAtAsc(Long courseClassId);

    Optional<CourseClassEnrollment> findByCourseClass_IdAndUser_Id(Long courseClassId, UUID userId);

    @EntityGraph(attributePaths = {"courseClass", "courseClass.course"})
    Page<CourseClassEnrollment> findByUser_Id(UUID userId, Pageable pageable);

    @EntityGraph(attributePaths = {"courseClass", "courseClass.course"})
    Optional<CourseClassEnrollment> findByIdAndUser_Id(Long enrollmentId, UUID userId);
}
