package com.managestudents.gradecomponent.repository;

import com.managestudents.gradecomponent.entity.GradeComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface GradeComponentRepository extends JpaRepository<GradeComponent, Long>, JpaSpecificationExecutor<GradeComponent> {

    boolean existsByComponentCode(String componentCode);

    boolean existsByComponentCodeAndIdNot(String componentCode, Long id);

    java.util.List<GradeComponent> findAllByOrderByIdAsc();
}
