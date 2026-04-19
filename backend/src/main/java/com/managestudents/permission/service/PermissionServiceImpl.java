package com.managestudents.permission.service;

import com.managestudents.permission.dto.LinkedRoleResponse;
import com.managestudents.permission.dto.PermissionCreateRequest;
import com.managestudents.permission.dto.PermissionResponse;
import com.managestudents.permission.dto.PermissionSuggestionResponse;
import com.managestudents.permission.dto.PermissionUpdateRequest;
import com.managestudents.permission.entity.Permission;
import com.managestudents.permission.entity.RolePermission;
import com.managestudents.permission.entity.RolePermissionId;
import com.managestudents.permission.repository.PermissionRepository;
import com.managestudents.permission.repository.PermissionSpecifications;
import com.managestudents.permission.repository.RolePermissionRepository;
import com.managestudents.role.entity.Role;
import com.managestudents.role.repository.RoleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PermissionServiceImpl implements PermissionService {

    private static final int SUGGEST_MAX = 20;

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;

    public PermissionServiceImpl(
            PermissionRepository permissionRepository,
            RoleRepository roleRepository,
            RolePermissionRepository rolePermissionRepository) {
        this.permissionRepository = permissionRepository;
        this.roleRepository = roleRepository;
        this.rolePermissionRepository = rolePermissionRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PermissionResponse> findAll(String keyword, Pageable pageable) {
        Page<Permission> page;
        if (keyword == null || keyword.isBlank()) {
            page = permissionRepository.findAll(pageable);
        } else {
            Specification<Permission> spec = PermissionSpecifications.matchesKeyword(keyword);
            page = permissionRepository.findAll(spec, pageable);
        }
        Map<Long, List<LinkedRoleResponse>> linkedByPerm =
                loadLinkedRolesForPermissionIds(
                        page.getContent().stream().map(Permission::getId).collect(Collectors.toList()));
        return page.map(p -> toResponse(p, linkedByPerm.getOrDefault(p.getId(), List.of())));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PermissionSuggestionResponse> suggest(String keyword, int limit) {
        if (keyword == null || keyword.isBlank()) {
            return List.of();
        }
        int cap = Math.min(Math.max(limit, 1), SUGGEST_MAX);
        Pageable pageable = PageRequest.of(0, cap);
        Specification<Permission> spec = PermissionSpecifications.matchesKeyword(keyword.trim());
        return permissionRepository.findAll(spec, pageable).getContent().stream()
                .map(this::toSuggestion)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PermissionResponse findById(Long id) {
        Permission entity = permissionRepository.findById(id)
                .orElseThrow(() -> new PermissionNotFoundException(id));
        Map<Long, List<LinkedRoleResponse>> linked =
                loadLinkedRolesForPermissionIds(List.of(id));
        return toResponse(entity, linked.getOrDefault(id, List.of()));
    }

    @Override
    @Transactional
    public PermissionResponse create(PermissionCreateRequest request) {
        String code = normalizeCode(request.getPermissionCode());
        if (permissionRepository.existsByPermissionCode(code)) {
            throw new DuplicatePermissionFieldException("permissionCode", code);
        }
        boolean admin = request.getVisibleInAdminPortal() == null || request.getVisibleInAdminPortal();
        boolean user = request.getVisibleInUserPortal() != null && request.getVisibleInUserPortal();
        validatePortals(admin, user);
        Permission p = new Permission();
        apply(p, code, request.getPermissionName(), request.getDescription(), admin, user);
        Permission saved = permissionRepository.save(p);
        replaceRoleLinks(saved.getId(), request.getRoleIds(), saved);
        Map<Long, List<LinkedRoleResponse>> linked =
                loadLinkedRolesForPermissionIds(List.of(saved.getId()));
        return toResponse(saved, linked.getOrDefault(saved.getId(), List.of()));
    }

    @Override
    @Transactional
    public PermissionResponse update(Long id, PermissionUpdateRequest request) {
        Permission p = permissionRepository.findById(id)
                .orElseThrow(() -> new PermissionNotFoundException(id));
        String code = normalizeCode(request.getPermissionCode());
        if (permissionRepository.existsByPermissionCodeAndIdNot(code, id)) {
            throw new DuplicatePermissionFieldException("permissionCode", code);
        }
        boolean admin = request.getVisibleInAdminPortal() == null || request.getVisibleInAdminPortal();
        boolean user = request.getVisibleInUserPortal() != null && request.getVisibleInUserPortal();
        validatePortals(admin, user);
        apply(p, code, request.getPermissionName(), request.getDescription(), admin, user);
        Permission saved = permissionRepository.save(p);
        replaceRoleLinks(saved.getId(), request.getRoleIds(), saved);
        Map<Long, List<LinkedRoleResponse>> linked =
                loadLinkedRolesForPermissionIds(List.of(saved.getId()));
        return toResponse(saved, linked.getOrDefault(saved.getId(), List.of()));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!permissionRepository.existsById(id)) {
            throw new PermissionNotFoundException(id);
        }
        rolePermissionRepository.deleteByPermissionId(id);
        permissionRepository.deleteById(id);
    }

    private static void validatePortals(boolean admin, boolean user) {
        if (!admin && !user) {
            throw new IllegalArgumentException(
                    "Cần bật ít nhất một cổng hiển thị (quản trị hoặc cổng thành viên).");
        }
    }

    private void replaceRoleLinks(Long permissionId, List<Long> roleIds, Permission permission) {
        rolePermissionRepository.deleteByPermissionId(permissionId);
        if (roleIds == null || roleIds.isEmpty()) {
            return;
        }
        Set<Long> unique = new LinkedHashSet<>();
        for (Long rid : roleIds) {
            if (rid != null) {
                unique.add(rid);
            }
        }
        for (Long roleId : unique) {
            Role role = roleRepository.findById(roleId)
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy vai trò id: " + roleId));
            RolePermissionId pk = new RolePermissionId();
            pk.setRoleId(role.getId());
            pk.setPermissionId(permissionId);
            RolePermission link = new RolePermission();
            link.setId(pk);
            link.setRole(role);
            link.setPermission(permission);
            rolePermissionRepository.save(link);
        }
    }

    private Map<Long, List<LinkedRoleResponse>> loadLinkedRolesForPermissionIds(List<Long> permissionIds) {
        Map<Long, List<LinkedRoleResponse>> grouped = new LinkedHashMap<>();
        if (permissionIds == null || permissionIds.isEmpty()) {
            return grouped;
        }
        List<RolePermission> rows =
                rolePermissionRepository.findAllFetchRoleByPermissionIdIn(permissionIds);
        for (RolePermission rp : rows) {
            Long pid = rp.getPermission().getId();
            LinkedRoleResponse lr = toLinkedRole(rp.getRole());
            grouped.computeIfAbsent(pid, k -> new ArrayList<>()).add(lr);
        }
        for (List<LinkedRoleResponse> list : grouped.values()) {
            list.sort(Comparator.comparing(LinkedRoleResponse::getRoleCode, String.CASE_INSENSITIVE_ORDER));
        }
        return grouped;
    }

    private static LinkedRoleResponse toLinkedRole(Role role) {
        LinkedRoleResponse lr = new LinkedRoleResponse();
        lr.setId(role.getId());
        lr.setRoleCode(role.getRoleCode());
        lr.setRoleName(role.getRoleName());
        return lr;
    }

    private static String normalizeCode(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.trim().toLowerCase(Locale.ROOT);
    }

    private static void apply(
            Permission p,
            String permissionCode,
            String permissionName,
            String description,
            boolean visibleInAdminPortal,
            boolean visibleInUserPortal) {
        p.setPermissionCode(permissionCode);
        p.setPermissionName(permissionName == null ? "" : permissionName.trim());
        p.setDescription(trimToNull(description));
        p.setVisibleInAdminPortal(visibleInAdminPortal);
        p.setVisibleInUserPortal(visibleInUserPortal);
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private PermissionResponse toResponse(Permission p, List<LinkedRoleResponse> linkedRoles) {
        PermissionResponse dto = new PermissionResponse();
        dto.setId(p.getId());
        dto.setPermissionCode(p.getPermissionCode());
        dto.setPermissionName(p.getPermissionName());
        dto.setDescription(p.getDescription());
        dto.setVisibleInAdminPortal(p.isVisibleInAdminPortal());
        dto.setVisibleInUserPortal(p.isVisibleInUserPortal());
        dto.setLinkedRoles(linkedRoles == null ? List.of() : linkedRoles);
        dto.setCreatedAt(p.getCreatedAt());
        dto.setUpdatedAt(p.getUpdatedAt());
        return dto;
    }

    private PermissionSuggestionResponse toSuggestion(Permission p) {
        PermissionSuggestionResponse s = new PermissionSuggestionResponse();
        s.setId(p.getId());
        s.setPermissionCode(p.getPermissionCode());
        s.setPermissionName(p.getPermissionName());
        return s;
    }
}
