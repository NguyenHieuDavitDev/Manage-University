package com.managestudents.permission.sidebar.dto;

import java.util.List;

public class RoleSidebarMenuStateResponse {

    private List<SidebarMenuGroupResponse> groups;
    private List<String> selectedPermissionCodes;

    public List<SidebarMenuGroupResponse> getGroups() {
        return groups;
    }

    public void setGroups(List<SidebarMenuGroupResponse> groups) {
        this.groups = groups;
    }

    public List<String> getSelectedPermissionCodes() {
        return selectedPermissionCodes;
    }

    public void setSelectedPermissionCodes(List<String> selectedPermissionCodes) {
        this.selectedPermissionCodes = selectedPermissionCodes;
    }
}
