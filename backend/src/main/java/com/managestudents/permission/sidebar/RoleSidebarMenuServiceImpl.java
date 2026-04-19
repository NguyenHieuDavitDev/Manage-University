package com.managestudents.permission.sidebar;

import com.managestudents.permission.entity.Permission;
import com.managestudents.permission.entity.RolePermission;
import com.managestudents.permission.entity.RolePermissionId;
import com.managestudents.permission.repository.PermissionRepository;
import com.managestudents.permission.repository.RolePermissionRepository;
import com.managestudents.permission.sidebar.dto.RoleSidebarMenuStateResponse;
import com.managestudents.permission.sidebar.dto.RoleSidebarMenuUpdateRequest;
import com.managestudents.permission.sidebar.dto.SidebarMenuGroupResponse;
import com.managestudents.permission.sidebar.dto.SidebarMenuItemResponse;
import com.managestudents.role.entity.Role;
import com.managestudents.role.repository.RoleRepository;
import com.managestudents.role.service.RoleNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RoleSidebarMenuServiceImpl implements RoleSidebarMenuService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;

    public RoleSidebarMenuServiceImpl(
            RoleRepository roleRepository,
            PermissionRepository permissionRepository,
            RolePermissionRepository rolePermissionRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.rolePermissionRepository = rolePermissionRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public RoleSidebarMenuStateResponse getState(Long roleId) {
        ensureRole(roleId);
        List<String> selected = loadSelectedCatalogCodes(roleId);
        RoleSidebarMenuStateResponse dto = new RoleSidebarMenuStateResponse();
        dto.setGroups(buildGroupResponses());
        dto.setSelectedPermissionCodes(selected);
        return dto;
    }

    @Override
    @Transactional
    public RoleSidebarMenuStateResponse update(Long roleId, RoleSidebarMenuUpdateRequest request) {
        Role role = ensureRole(roleId);
        List<String> invalid = SidebarMenuCatalog.invalidCodes(request.getPermissionCodes());
        if (!invalid.isEmpty()) {
            throw new IllegalArgumentException("Mã quyền không thuộc menu sidebar: " + String.join(", ", invalid));
        }
        Set<String> requested = new LinkedHashSet<>();
        for (String raw : request.getPermissionCodes()) {
            String c = SidebarMenuCatalog.normalizeCode(raw);
            if (!c.isEmpty()) {
                requested.add(c);
            }
        }
        Set<String> catalog = SidebarMenuCatalog.allCodes();
        for (String code : catalog) {
            Permission p = findOrCreateCatalogPermission(code);
            boolean want = requested.contains(code);
            long cnt = rolePermissionRepository.countByRoleIdAndPermissionId(role.getId(), p.getId());
            boolean has = cnt > 0;
            if (want && !has) {
                addLink(role, p);
            } else if (!want && has) {
                rolePermissionRepository.deleteByRoleIdAndPermissionId(role.getId(), p.getId());
            }
        }
        return getState(roleId);
    }

    private Role ensureRole(Long roleId) {
        return roleRepository.findById(roleId).orElseThrow(() -> new RoleNotFoundException(roleId));
    }

    private List<String> loadSelectedCatalogCodes(Long roleId) {
        Set<String> catalog = SidebarMenuCatalog.allCodes();
        List<RolePermission> links = rolePermissionRepository.findAllFetchPermissionByRoleId(roleId);
        List<String> selected = new ArrayList<>();
        for (RolePermission rp : links) {
            String code = rp.getPermission().getPermissionCode();
            if (catalog.contains(code)) {
                selected.add(code);
            }
        }
        selected.sort(String.CASE_INSENSITIVE_ORDER);
        return selected;
    }

    private List<SidebarMenuGroupResponse> buildGroupResponses() {
        return SidebarMenuCatalog.groups().stream()
                .map(g -> {
                    SidebarMenuGroupResponse gr = new SidebarMenuGroupResponse();
                    gr.setGroupId(g.groupId());
                    gr.setGroupLabel(g.groupLabel());
                    gr.setItems(g.items().stream()
                            .map(it -> {
                                SidebarMenuItemResponse ir = new SidebarMenuItemResponse();
                                ir.setPermissionCode(it.permissionCode());
                                ir.setLabel(it.label());
                                return ir;
                            })
                            .collect(Collectors.toList()));
                    return gr;
                })
                .collect(Collectors.toList());
    }

    private Permission findOrCreateCatalogPermission(String code) {
        return permissionRepository.findByPermissionCode(code).orElseGet(() -> {
            Permission p = new Permission();
            p.setPermissionCode(code);
            p.setPermissionName(SidebarMenuCatalog.labelForCode(code));
            p.setDescription("Tự động tạo khi cấu hình menu sidebar theo vai trò");
            p.setVisibleInAdminPortal(true);
            p.setVisibleInUserPortal(false);
            return permissionRepository.save(p);
        });
    }

    private void addLink(Role role, Permission permission) {
        RolePermissionId id = new RolePermissionId();
        id.setRoleId(role.getId());
        id.setPermissionId(permission.getId());
        RolePermission link = new RolePermission();
        link.setId(id);
        link.setRole(role);
        link.setPermission(permission);
        rolePermissionRepository.save(link);
    }
}
