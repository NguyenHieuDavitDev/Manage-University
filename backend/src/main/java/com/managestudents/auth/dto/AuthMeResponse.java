package com.managestudents.auth.dto;

import java.util.List;
import java.util.UUID;

public class AuthMeResponse {

    private UUID userId;
    private String username;
    private String email;
    private String fullName;
    private List<String> roles;
    private String defaultRoute;
    /** Quyền hiển thị theo vai trò của tài khoản (menu, cổng admin/user). */
    private List<AuthDisplayPermissionDto> displayPermissions;

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    public String getDefaultRoute() {
        return defaultRoute;
    }

    public void setDefaultRoute(String defaultRoute) {
        this.defaultRoute = defaultRoute;
    }

    public List<AuthDisplayPermissionDto> getDisplayPermissions() {
        return displayPermissions;
    }

    public void setDisplayPermissions(List<AuthDisplayPermissionDto> displayPermissions) {
        this.displayPermissions = displayPermissions;
    }
}
