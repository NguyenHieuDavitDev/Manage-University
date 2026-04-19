package com.managestudents.user.repository;

import com.managestudents.user.entity.UserRole;
import com.managestudents.user.entity.UserRoleId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface UserRoleRepository extends JpaRepository<UserRole, UserRoleId> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM UserRole ur WHERE ur.id.userId = :userId")
    void deleteByUserId(@Param("userId") UUID userId);

    @Query("SELECT ur FROM UserRole ur JOIN FETCH ur.role WHERE ur.id.userId IN :userIds")
    List<UserRole> findAllFetchRoleByUserIdIn(@Param("userIds") Collection<UUID> userIds);

    @Query("SELECT ur.id.roleId FROM UserRole ur WHERE ur.id.userId = :userId")
    List<Long> findRoleIdsByUserId(@Param("userId") UUID userId);
}
