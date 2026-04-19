package com.managestudents.department.repository;

import com.managestudents.department.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface DepartmentRepository extends JpaRepository<Department, Long>, JpaSpecificationExecutor<Department> {

    boolean existsByDepartmentCode(String departmentCode);

    boolean existsByDepartmentCodeAndIdNot(String departmentCode, Long id);
}
