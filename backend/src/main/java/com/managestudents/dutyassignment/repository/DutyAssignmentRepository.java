package com.managestudents.dutyassignment.repository;

import com.managestudents.dutyassignment.entity.DutyAssignment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface DutyAssignmentRepository
        extends JpaRepository<DutyAssignment, Long>, JpaSpecificationExecutor<DutyAssignment> {

    @EntityGraph(attributePaths = {"user", "faculty", "department", "position"})
    @Override
    Page<DutyAssignment> findAll(Specification<DutyAssignment> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"user", "faculty", "department", "position"})
    Optional<DutyAssignment> findById(Long id);

    @EntityGraph(attributePaths = {"user", "faculty", "department", "position"})
    Optional<DutyAssignment> findByUser_Id(UUID userId);

    boolean existsByUser_Id(UUID userId);

    void deleteByUser_Id(UUID userId);
}
