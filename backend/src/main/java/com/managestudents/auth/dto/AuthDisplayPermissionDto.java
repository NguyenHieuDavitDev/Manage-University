package com.managestudents.auth.dto;

public class AuthDisplayPermissionDto {

    private String permissionCode;
    private String permissionName;
    private boolean visibleInAdminPortal;
    private boolean visibleInUserPortal;

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
}
