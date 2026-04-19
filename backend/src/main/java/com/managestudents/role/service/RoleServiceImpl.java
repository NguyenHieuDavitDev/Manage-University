package com.managestudents.role.service;

import com.managestudents.role.dto.RoleCreateRequest;
import com.managestudents.role.dto.RoleResponse;
import com.managestudents.role.dto.RoleSuggestionResponse;
import com.managestudents.role.dto.RoleUpdateRequest;
import com.managestudents.role.entity.Role;
import com.managestudents.role.repository.RoleRepository;
import com.managestudents.role.repository.RoleSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RoleServiceImpl implements RoleService {

    private static final int SUGGEST_MAX = 20;

    private final RoleRepository roleRepository;

    public RoleServiceImpl(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<RoleResponse> findAll(String keyword, Pageable pageable) {
        Page<Role> page;
        if (keyword == null || keyword.isBlank()) {
            page = roleRepository.findAll(pageable);
        } else {
            Specification<Role> spec = RoleSpecifications.matchesKeyword(keyword);
            page = roleRepository.findAll(spec, pageable);
        }
        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoleSuggestionResponse> suggest(String keyword, int limit) {
        if (keyword == null || keyword.isBlank()) {
            return List.of();
        }
        int cap = Math.min(Math.max(limit, 1), SUGGEST_MAX);
        Pageable pageable = PageRequest.of(0, cap);
        Specification<Role> spec = RoleSpecifications.matchesKeyword(keyword.trim());
        return roleRepository.findAll(spec, pageable).getContent().stream()
                .map(this::toSuggestion)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public RoleResponse findById(Long id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RoleNotFoundException(id));
        return toResponse(role);
    }

    @Override
    @Transactional
    public RoleResponse create(RoleCreateRequest request) {
        String code = normalizeCode(request.getRoleCode());
        if (roleRepository.existsByRoleCode(code)) {
            throw new DuplicateRoleFieldException("roleCode", code);
        }
        Role role = new Role();
        apply(role, code, request.getRoleName(), request.getDescription());
        return toResponse(roleRepository.save(role));
    }

    @Override
    @Transactional
    public RoleResponse update(Long id, RoleUpdateRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RoleNotFoundException(id));
        String code = normalizeCode(request.getRoleCode());
        if (roleRepository.existsByRoleCodeAndIdNot(code, id)) {
            throw new DuplicateRoleFieldException("roleCode", code);
        }
        apply(role, code, request.getRoleName(), request.getDescription());
        return toResponse(roleRepository.save(role));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!roleRepository.existsById(id)) {
            throw new RoleNotFoundException(id);
        }
        roleRepository.deleteById(id);
    }

    private static String normalizeCode(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private static void apply(Role role, String roleCode, String roleName, String description) {
        role.setRoleCode(roleCode);
        role.setRoleName(roleName == null ? "" : roleName.trim());
        role.setDescription(trimToNull(description));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private RoleResponse toResponse(Role role) {
        RoleResponse dto = new RoleResponse();
        dto.setId(role.getId());
        dto.setRoleCode(role.getRoleCode());
        dto.setRoleName(role.getRoleName());
        dto.setDescription(role.getDescription());
        dto.setCreatedAt(role.getCreatedAt());
        dto.setUpdatedAt(role.getUpdatedAt());
        return dto;
    }

    private RoleSuggestionResponse toSuggestion(Role role) {
        RoleSuggestionResponse s = new RoleSuggestionResponse();
        s.setId(role.getId());
        s.setRoleCode(role.getRoleCode());
        s.setRoleName(role.getRoleName());
        return s;
    }
}
