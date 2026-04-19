package com.managestudents.courseclass.repository;

import com.managestudents.courseclass.entity.CourseClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface CourseClassRepository extends JpaRepository<CourseClass, Long>, JpaSpecificationExecutor<CourseClass> {

    boolean existsByCourse_IdAndSectionCode(Long courseId, String sectionCode);

    boolean existsByCourse_IdAndSectionCodeAndIdNot(Long courseId, String sectionCode, Long id);
}
