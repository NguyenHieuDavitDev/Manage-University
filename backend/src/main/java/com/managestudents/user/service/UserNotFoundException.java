package com.managestudents.user.service;

import java.util.UUID;

public class UserNotFoundException extends RuntimeException {

    private final UUID userId;

    public UserNotFoundException(UUID userId) {
        super("Không tìm thấy người dùng với id: " + userId);
        this.userId = userId;
    }

    public UUID getUserId() {
        return userId;
    }
}
