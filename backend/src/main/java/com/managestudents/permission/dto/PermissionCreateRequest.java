package com.managestudents.permission.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public class PermissionCreateRequest {

    @NotBlank
    @Size(max = 128)
    private String permissionCode;

    @NotBlank
    @Size(max = 200)
    private String permissionName;

    @Size(max = 500)
    private String description;

    /** Mặc định true nếu JSON bỏ qua trường. */
    private Boolean visibleInAdminPortal;

    /** Mặc định false nếu JSON bỏ qua trường. */
    private Boolean visibleInUserPortal;

    /** Vai trò được gán quyền này (tài khoản có vai trò đó mới thấy khi đủ cờ cổng). */
    private List<Long> roleIds = new ArrayList<>();

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

    public Boolean getVisibleInAdminPortal() {
        return visibleInAdminPortal;
    }

    public void setVisibleInAdminPortal(Boolean visibleInAdminPortal) {
        this.visibleInAdminPortal = visibleInAdminPortal;
    }

    public Boolean getVisibleInUserPortal() {
        return visibleInUserPortal;
    }

    public void setVisibleInUserPortal(Boolean visibleInUserPortal) {
        this.visibleInUserPortal = visibleInUserPortal;
    }

    public List<Long> getRoleIds() {
        return roleIds;
    }

    public void setRoleIds(List<Long> roleIds) {
        this.roleIds = roleIds == null ? new ArrayList<>() : roleIds;
    }
}
