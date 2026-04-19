package com.managestudents.role.repository;

import com.managestudents.role.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long>, JpaSpecificationExecutor<Role> {

    boolean existsByRoleCode(String roleCode);

    boolean existsByRoleCodeAndIdNot(String roleCode, Long id);

    Optional<Role> findByRoleCode(String roleCode);

    @Query("select r from Role r where lower(r.roleCode) = lower(:code)")
    Optional<Role> findByRoleCodeIgnoreCase(@Param("code") String code);
}
