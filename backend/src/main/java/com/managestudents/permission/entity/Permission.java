package com.managestudents.permission.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "permissions")
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "permission_code",
            nullable = false,
            unique = true,
            columnDefinition = "NVARCHAR(128)"
    )
    private String permissionCode;

    @Column(
            name = "permission_name",
            nullable = false,
            columnDefinition = "NVARCHAR(200)"
    )
    private String permissionName;

    @Column(name = "description", columnDefinition = "NVARCHAR(500)")
    private String description;

    @Column(name = "visible_in_admin_portal", nullable = false)
    private boolean visibleInAdminPortal = true;

    @Column(name = "visible_in_user_portal", nullable = false)
    private boolean visibleInUserPortal = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

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
