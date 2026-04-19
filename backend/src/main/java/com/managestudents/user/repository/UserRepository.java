package com.managestudents.user.repository;

import com.managestudents.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

    boolean existsByUsernameIgnoreCaseAndIsDeletedFalse(String username);

    boolean existsByEmailIgnoreCaseAndIsDeletedFalse(String email);

    boolean existsByUsernameIgnoreCaseAndIdNotAndIsDeletedFalse(String username, UUID id);

    boolean existsByEmailIgnoreCaseAndIdNotAndIsDeletedFalse(String email, UUID id);

    Optional<User> findByIdAndIsDeletedFalse(UUID id);

    Optional<User> findByUsernameIgnoreCaseAndIsDeletedFalse(String username);

    Optional<User> findByEmailIgnoreCaseAndIsDeletedFalse(String email);
}
