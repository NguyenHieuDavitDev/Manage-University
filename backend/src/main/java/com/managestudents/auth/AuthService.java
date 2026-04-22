package com.managestudents.auth;

import com.managestudents.auth.dto.AuthDisplayPermissionDto;
import com.managestudents.auth.dto.AuthMeResponse;
import com.managestudents.auth.dto.AuthResponse;
import com.managestudents.auth.dto.LoginRequest;
import com.managestudents.auth.dto.RegisterRequest;
import com.managestudents.permission.entity.Permission;
import com.managestudents.permission.entity.RolePermission;
import com.managestudents.permission.repository.RolePermissionRepository;
import com.managestudents.role.entity.Role;
import com.managestudents.role.repository.RoleRepository;
import com.managestudents.security.JwtPrincipal;
import com.managestudents.security.JwtService;
import com.managestudents.security.JwtProperties;
import com.managestudents.user.service.DuplicateUserFieldException;
import com.managestudents.user.entity.User;
import com.managestudents.user.entity.UserRole;
import com.managestudents.user.entity.UserRoleId;
import com.managestudents.user.entity.UserStatus;
import com.managestudents.user.repository.UserRepository;
import com.managestudents.user.repository.UserRoleRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final String DEFAULT_REGISTER_ROLE = "USER";

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;

    public AuthService(
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            RoleRepository roleRepository,
            RolePermissionRepository rolePermissionRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            JwtProperties jwtProperties) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.roleRepository = roleRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtProperties = jwtProperties;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String username = request.getUsername().trim();
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByUsernameIgnoreCaseAndIsDeletedFalse(username)) {
            throw new DuplicateUserFieldException("username", username);
        }
        if (userRepository.existsByEmailIgnoreCaseAndIsDeletedFalse(email)) {
            throw new DuplicateUserFieldException("email", email);
        }
        Role userRole = roleRepository
                .findByRoleCodeIgnoreCase(DEFAULT_REGISTER_ROLE)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Chưa có vai trò USER trong hệ thống. Tạo role mã USER trước khi mở đăng ký."));

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setStatus(UserStatus.Active);
        user.setFullName(request.getFullName().trim());
        user.setIsEmailVerified(false);
        user.setIsPhoneVerified(false);
        user.setFailedLoginCount(0);
        user.setIsDeleted(false);
        User saved = userRepository.save(user);

        UserRole link = new UserRole();
        link.setId(new UserRoleId());
        link.setUser(saved);
        link.setRole(userRole);
        userRoleRepository.save(link);

        List<String> roleCodes = List.of(userRole.getRoleCode());
        return buildAuthResponse(saved, roleCodes);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String key = request.getUsernameOrEmail().trim();
        Optional<User> byName = userRepository.findByUsernameIgnoreCaseAndIsDeletedFalse(key);
        User user = byName.orElseGet(
                () -> userRepository.findByEmailIgnoreCaseAndIsDeletedFalse(key.toLowerCase())
                        .orElseThrow(() -> new BadCredentialsException("Sai tên đăng nhập hoặc mật khẩu")));
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Sai tên đăng nhập hoặc mật khẩu");
        }
        if (user.getStatus() != UserStatus.Active) {
            throw new BadCredentialsException("Tài khoản không hoạt động hoặc đang khóa");
        }
        List<String> roleCodes = loadRoleCodes(user.getId());
        return buildAuthResponse(user, roleCodes);
    }

    @Transactional(readOnly = true)
    public AuthMeResponse me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof JwtPrincipal p)) {
            throw new BadCredentialsException("Chưa đăng nhập hoặc phiên đã hết hạn");
        }
        User user = userRepository.findByIdAndIsDeletedFalse(p.userId())
                .orElseThrow(() -> new BadCredentialsException("Người dùng không tồn tại"));
        List<String> roleCodes = loadRoleCodes(user.getId());
        AuthMeResponse dto = new AuthMeResponse();
        dto.setUserId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setRoles(roleCodes);
        dto.setDefaultRoute(PortalRouting.defaultRoute(roleCodes));
        dto.setDisplayPermissions(loadDisplayPermissions(user.getId()));
        return dto;
    }

    private List<String> loadRoleCodes(UUID userId) {
        List<UserRole> links = userRoleRepository.findAllFetchRoleByUserIdIn(List.of(userId));
        List<String> codes = new ArrayList<>();
        for (UserRole ur : links) {
            codes.add(ur.getRole().getRoleCode());
        }
        codes.sort(String.CASE_INSENSITIVE_ORDER);
        return codes;
    }

    private List<AuthDisplayPermissionDto> loadDisplayPermissions(UUID userId) {
        List<Long> roleIds = userRoleRepository.findRoleIdsByUserId(userId);
        if (roleIds.isEmpty()) {
            return List.of();
        }
        List<RolePermission> links = rolePermissionRepository.findAllFetchPermissionByRoleIdIn(roleIds);
        LinkedHashMap<Long, Permission> byId = new LinkedHashMap<>();
        for (RolePermission rp : links) {
            Permission perm = rp.getPermission();
            byId.putIfAbsent(perm.getId(), perm);
        }
        return byId.values().stream()
                .sorted(Comparator.comparing(Permission::getPermissionCode, String.CASE_INSENSITIVE_ORDER))
                .map(this::toDisplayPermission)
                .toList();
    }

    private AuthDisplayPermissionDto toDisplayPermission(Permission p) {
        AuthDisplayPermissionDto d = new AuthDisplayPermissionDto();
        d.setPermissionCode(p.getPermissionCode());
        d.setPermissionName(p.getPermissionName());
        d.setVisibleInAdminPortal(p.isVisibleInAdminPortal());
        d.setVisibleInUserPortal(p.isVisibleInUserPortal());
        return d;
    }

    private AuthResponse buildAuthResponse(User user, List<String> roleCodes) {
        String token = jwtService.createAccessToken(user.getId(), user.getUsername(), roleCodes);
        AuthResponse dto = new AuthResponse();
        dto.setAccessToken(token);
        dto.setTokenType("Bearer");
        dto.setExpiresInSeconds(jwtProperties.getExpirationMs() / 1000);
        dto.setUserId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setRoles(roleCodes);
        dto.setDefaultRoute(PortalRouting.defaultRoute(roleCodes));
        dto.setDisplayPermissions(loadDisplayPermissions(user.getId()));
        return dto;
    }
}
