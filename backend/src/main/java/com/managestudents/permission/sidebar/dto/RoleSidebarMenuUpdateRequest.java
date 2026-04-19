package com.managestudents.permission.sidebar.dto;

import java.util.ArrayList;
import java.util.List;

public class RoleSidebarMenuUpdateRequest {

    /** Mã quyền trùng catalog sidebar (có thể rỗng = không mục menu nào ngoài trang chủ /admin). */
    private List<String> permissionCodes = new ArrayList<>();

    public List<String> getPermissionCodes() {
        return permissionCodes;
    }

    public void setPermissionCodes(List<String> permissionCodes) {
        this.permissionCodes = permissionCodes == null ? new ArrayList<>() : permissionCodes;
    }
}
