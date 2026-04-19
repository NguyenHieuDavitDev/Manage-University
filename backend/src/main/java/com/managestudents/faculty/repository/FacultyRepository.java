package com.managestudents.faculty.repository;

import com.managestudents.faculty.entity.Faculty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface FacultyRepository extends JpaRepository<Faculty, Long>, JpaSpecificationExecutor<Faculty> {

    boolean existsByFacultyCode(String facultyCode);

    boolean existsByFacultyCodeAndIdNot(String facultyCode, Long id);
}
