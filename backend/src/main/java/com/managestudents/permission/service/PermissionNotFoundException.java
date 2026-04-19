package com.managestudents.permission.service;

public class PermissionNotFoundException extends RuntimeException {

    private final Long permissionId;

    public PermissionNotFoundException(Long permissionId) {
        super("Không tìm thấy quyền với id: " + permissionId);
        this.permissionId = permissionId;
    }

    public Long getPermissionId() {
        return permissionId;
    }
}
