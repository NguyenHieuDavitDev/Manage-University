package com.managestudents.permission.sidebar;

import com.managestudents.permission.sidebar.dto.RoleSidebarMenuStateResponse;
import com.managestudents.permission.sidebar.dto.RoleSidebarMenuUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/roles/{roleId}/sidebar-menu")
public class RoleSidebarMenuController {

    private final RoleSidebarMenuService roleSidebarMenuService;

    public RoleSidebarMenuController(RoleSidebarMenuService roleSidebarMenuService) {
        this.roleSidebarMenuService = roleSidebarMenuService;
    }

    /**
     * Danh mục nhóm mục sidebar + các mã quyền đang bật cho vai trò.
     */
    @GetMapping
    public ResponseEntity<RoleSidebarMenuStateResponse> get(@PathVariable Long roleId) {
        return ResponseEntity.ok(roleSidebarMenuService.getState(roleId));
    }

    /**
     * Lưu lựa chọn menu cho vai trò (đồng bộ bảng {@code role_permissions}; tự tạo {@code Permission} nếu chưa có).
     */
    @PutMapping
    public ResponseEntity<RoleSidebarMenuStateResponse> update(
            @PathVariable Long roleId,
            @Valid @RequestBody RoleSidebarMenuUpdateRequest request) {
        return ResponseEntity.ok(roleSidebarMenuService.update(roleId, request));
    }
}
