package com.managestudents.permission.sidebar;

import com.managestudents.permission.sidebar.dto.RoleSidebarMenuStateResponse;
import com.managestudents.permission.sidebar.dto.RoleSidebarMenuUpdateRequest;

public interface RoleSidebarMenuService {

    RoleSidebarMenuStateResponse getState(Long roleId);

    RoleSidebarMenuStateResponse update(Long roleId, RoleSidebarMenuUpdateRequest request);
}
