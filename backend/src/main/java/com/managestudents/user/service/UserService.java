package com.managestudents.user.service;

import com.managestudents.user.dto.UserCreateRequest;
import com.managestudents.user.dto.UserResponse;
import com.managestudents.user.dto.UserUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface UserService {

    Page<UserResponse> findAll(String keyword, Pageable pageable);

    UserResponse findById(UUID id);

    UserResponse create(UserCreateRequest request);

    UserResponse update(UUID id, UserUpdateRequest request);

    void softDelete(UUID id);
}
