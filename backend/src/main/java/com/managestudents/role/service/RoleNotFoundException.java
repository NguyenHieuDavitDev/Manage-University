package com.managestudents.role.service;

public class RoleNotFoundException extends RuntimeException {

    private final Long roleId;

    public RoleNotFoundException(Long roleId) {
        super("Không tìm thấy vai trò với id: " + roleId);
        this.roleId = roleId;
    }

    public Long getRoleId() {
        return roleId;
    }
}
