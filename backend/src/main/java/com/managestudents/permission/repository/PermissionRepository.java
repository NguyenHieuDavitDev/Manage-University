package com.managestudents.permission.repository;

import com.managestudents.permission.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface PermissionRepository
        extends JpaRepository<Permission, Long>, JpaSpecificationExecutor<Permission> {

    boolean existsByPermissionCode(String permissionCode);

    boolean existsByPermissionCodeAndIdNot(String permissionCode, Long id);

    Optional<Permission> findByPermissionCode(String permissionCode);
}
