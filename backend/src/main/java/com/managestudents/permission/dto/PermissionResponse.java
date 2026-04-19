package com.managestudents.permission.dto;

import java.time.Instant;
import java.util.List;

public class PermissionResponse {

    private Long id;
    private String permissionCode;
    private String permissionName;
    private String description;
    private boolean visibleInAdminPortal;
    private boolean visibleInUserPortal;
    private List<LinkedRoleResponse> linkedRoles;
    private Instant createdAt;
    private Instant updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPermissionCode() {
        return permissionCode;
    }

    public void setPermissionCode(String permissionCode) {
        this.permissionCode = permissionCode;
    }

    public String getPermissionName() {
        return permissionName;
    }

    public void setPermissionName(String permissionName) {
        this.permissionName = permissionName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isVisibleInAdminPortal() {
        return visibleInAdminPortal;
    }

    public void setVisibleInAdminPortal(boolean visibleInAdminPortal) {
        this.visibleInAdminPortal = visibleInAdminPortal;
    }

    public boolean isVisibleInUserPortal() {
        return visibleInUserPortal;
    }

    public void setVisibleInUserPortal(boolean visibleInUserPortal) {
        this.visibleInUserPortal = visibleInUserPortal;
    }

    public List<LinkedRoleResponse> getLinkedRoles() {
        return linkedRoles;
    }

    public void setLinkedRoles(List<LinkedRoleResponse> linkedRoles) {
        this.linkedRoles = linkedRoles;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
