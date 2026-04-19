package com.managestudents.permission.repository;

import com.managestudents.permission.entity.RolePermission;
import com.managestudents.permission.entity.RolePermissionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface RolePermissionRepository extends JpaRepository<RolePermission, RolePermissionId> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM RolePermission rp WHERE rp.permission.id = :permissionId")
    void deleteByPermissionId(@Param("permissionId") Long permissionId);

    @Query("SELECT rp FROM RolePermission rp JOIN FETCH rp.role WHERE rp.permission.id IN :permissionIds")
    List<RolePermission> findAllFetchRoleByPermissionIdIn(@Param("permissionIds") Collection<Long> permissionIds);

    @Query("SELECT rp FROM RolePermission rp JOIN FETCH rp.permission WHERE rp.role.id IN :roleIds")
    List<RolePermission> findAllFetchPermissionByRoleIdIn(@Param("roleIds") Collection<Long> roleIds);

    @Query("SELECT rp FROM RolePermission rp JOIN FETCH rp.permission WHERE rp.role.id = :roleId")
    List<RolePermission> findAllFetchPermissionByRoleId(@Param("roleId") Long roleId);

    @Query("SELECT COUNT(rp) FROM RolePermission rp WHERE rp.role.id = :roleId AND rp.permission.id = :permissionId")
    long countByRoleIdAndPermissionId(@Param("roleId") Long roleId, @Param("permissionId") Long permissionId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM RolePermission rp WHERE rp.role.id = :roleId AND rp.permission.id = :permissionId")
    void deleteByRoleIdAndPermissionId(@Param("roleId") Long roleId, @Param("permissionId") Long permissionId);
}
