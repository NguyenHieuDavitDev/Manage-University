package com.managestudents.permission.sidebar.dto;

public class SidebarMenuItemResponse {

    private String permissionCode;
    private String label;

    public String getPermissionCode() {
        return permissionCode;
    }

    public void setPermissionCode(String permissionCode) {
        this.permissionCode = permissionCode;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }
}
