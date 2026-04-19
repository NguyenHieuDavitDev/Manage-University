package com.managestudents.permission.sidebar.dto;

import java.util.List;

public class SidebarMenuGroupResponse {

    private String groupId;
    private String groupLabel;
    private List<SidebarMenuItemResponse> items;

    public String getGroupId() {
        return groupId;
    }

    public void setGroupId(String groupId) {
        this.groupId = groupId;
    }

    public String getGroupLabel() {
        return groupLabel;
    }

    public void setGroupLabel(String groupLabel) {
        this.groupLabel = groupLabel;
    }

    public List<SidebarMenuItemResponse> getItems() {
        return items;
    }

    public void setItems(List<SidebarMenuItemResponse> items) {
        this.items = items;
    }
}
