package com.managestudents.auth.dto;

import java.util.List;
import java.util.UUID;

public class AuthResponse {

    private String accessToken;
    private String tokenType = "Bearer";
    private long expiresInSeconds;
    private UUID userId;
    private String username;
    private String email;
    private String fullName;
    private List<String> roles;
    /** Đường dẫn Next.js: {@code /admin} hoặc {@code /user} */
    private String defaultRoute;
    private List<AuthDisplayPermissionDto> displayPermissions;

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public long getExpiresInSeconds() {
        return expiresInSeconds;
    }

    public void setExpiresInSeconds(long expiresInSeconds) {
        this.expiresInSeconds = expiresInSeconds;
    }

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
