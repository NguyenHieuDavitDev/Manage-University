package com.managestudents.user.service;

import com.managestudents.dutyassignment.repository.DutyAssignmentRepository;
import com.managestudents.role.entity.Role;
import com.managestudents.role.repository.RoleRepository;
import com.managestudents.user.dto.UserCreateRequest;
import com.managestudents.user.dto.UserResponse;
import com.managestudents.user.dto.UserRoleSummary;
import com.managestudents.user.dto.UserUpdateRequest;
import com.managestudents.user.entity.User;
import com.managestudents.user.entity.UserRole;
import com.managestudents.user.entity.UserRoleId;
import com.managestudents.user.entity.UserStatus;
import com.managestudents.user.repository.UserRepository;
import com.managestudents.user.repository.UserRoleRepository;
import com.managestudents.storage.AvatarStorageService;
import com.managestudents.user.repository.UserSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;
    private final DutyAssignmentRepository dutyAssignmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AvatarStorageService avatarStorageService;

    public UserServiceImpl(
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            RoleRepository roleRepository,
            DutyAssignmentRepository dutyAssignmentRepository,
            PasswordEncoder passwordEncoder,
            AvatarStorageService avatarStorageService) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.roleRepository = roleRepository;
        this.dutyAssignmentRepository = dutyAssignmentRepository;
        this.passwordEncoder = passwordEncoder;
        this.avatarStorageService = avatarStorageService;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<UserResponse> findAll(String keyword, Pageable pageable) {
        Specification<User> spec = Specification.where(UserSpecifications.notDeleted());
        if (keyword != null && !keyword.isBlank()) {
            spec = spec.and(UserSpecifications.matchesKeyword(keyword));
        }
        Page<User> page = userRepository.findAll(spec, pageable);
        Map<UUID, List<UserRoleSummary>> rolesByUser =
                loadRolesGrouped(page.getContent().stream().map(User::getId).toList());
        return page.map(u -> toResponse(u, rolesByUser.getOrDefault(u.getId(), List.of())));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse findById(UUID id) {
        User user = userRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        Map<UUID, List<UserRoleSummary>> rolesByUser = loadRolesGrouped(List.of(user.getId()));
        return toResponse(user, rolesByUser.getOrDefault(user.getId(), List.of()));
    }

    @Override
    @Transactional
    public UserResponse create(UserCreateRequest request) {
        String username = normalizeUsername(request.getUsername());
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByUsernameIgnoreCaseAndIsDeletedFalse(username)) {
            throw new DuplicateUserFieldException("username", username);
        }
        if (userRepository.existsByEmailIgnoreCaseAndIsDeletedFalse(email)) {
            throw new DuplicateUserFieldException("email", email);
        }
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setStatus(request.getStatus() != null ? request.getStatus() : UserStatus.Active);
        applyProfile(user,
                request.getPhoneNumber(),
                request.getFullName(),
                request.getDob(),
                request.getGender(),
                request.getCccd(),
                request.getPassport(),
                request.getAddress(),
                request.getCurrentAddress(),
                request.getPersonalEmail(),
                request.getAvatarUrl(),
                request.getNationality(),
                request.getEthnicity(),
                request.getMaritalStatus());
        user.setIsEmailVerified(false);
        user.setIsPhoneVerified(false);
        user.setFailedLoginCount(0);
        user.setIsDeleted(false);
        User saved = userRepository.save(user);
        replaceUserRoles(saved, request.getRoleIds());
        return toResponse(saved, loadRolesGrouped(List.of(saved.getId())).getOrDefault(saved.getId(), List.of()));
    }

    @Override
    @Transactional
    public UserResponse update(UUID id, UserUpdateRequest request) {
        User user = userRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        String previousAvatarUrl = user.getAvatarUrl();
        String username = normalizeUsername(request.getUsername());
        String email = normalizeEmail(request.getEmail());
        if (!username.equalsIgnoreCase(user.getUsername())
                && userRepository.existsByUsernameIgnoreCaseAndIdNotAndIsDeletedFalse(username, id)) {
            throw new DuplicateUserFieldException("username", username);
        }
        if (!email.equalsIgnoreCase(user.getEmail())
                && userRepository.existsByEmailIgnoreCaseAndIdNotAndIsDeletedFalse(email, id)) {
            throw new DuplicateUserFieldException("email", email);
        }
        String pw = request.getPassword();
        if (pw != null && !pw.isBlank()) {
            if (pw.length() < 6) {
                throw new IllegalArgumentException("Mật khẩu mới phải có ít nhất 6 ký tự");
            }
            user.setPasswordHash(passwordEncoder.encode(pw));
        }
        user.setUsername(username);
        user.setEmail(email);
        user.setStatus(request.getStatus());
        applyProfile(user,
                request.getPhoneNumber(),
                request.getFullName(),
                request.getDob(),
                request.getGender(),
                request.getCccd(),
                request.getPassport(),
                request.getAddress(),
                request.getCurrentAddress(),
                request.getPersonalEmail(),
                request.getAvatarUrl(),
                request.getNationality(),
                request.getEthnicity(),
                request.getMaritalStatus());
        User saved = userRepository.save(user);
        if (request.getRoleIds() != null) {
            replaceUserRoles(saved, request.getRoleIds());
        }
        avatarStorageService.deleteIfReplaced(previousAvatarUrl, saved.getAvatarUrl());
        return toResponse(saved, loadRolesGrouped(List.of(saved.getId())).getOrDefault(saved.getId(), List.of()));
    }

    @Override
    @Transactional
    public void softDelete(UUID id) {
        User user = userRepository.findByIdAndIsDeletedFalse(id)
                .orElseThrow(() -> new UserNotFoundException(id));
        avatarStorageService.deleteIfManaged(user.getAvatarUrl());
        userRoleRepository.deleteByUserId(id);
        dutyAssignmentRepository.deleteByUser_Id(id);
        user.setIsDeleted(true);
        userRepository.save(user);
    }

    private Map<UUID, List<UserRoleSummary>> loadRolesGrouped(Collection<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Map.of();
        }
        List<UserRole> links = userRoleRepository.findAllFetchRoleByUserIdIn(userIds);
        Map<UUID, List<UserRoleSummary>> map = new HashMap<>();
        for (UserRole ur : links) {
            UUID uid = ur.getId() != null && ur.getId().getUserId() != null
                    ? ur.getId().getUserId()
                    : ur.getUser().getId();
            Role role = ur.getRole();
            map.computeIfAbsent(uid, k -> new ArrayList<>()).add(toRoleSummary(role));
        }
        for (List<UserRoleSummary> list : map.values()) {
            list.sort(Comparator.comparing(UserRoleSummary::getRoleCode, String.CASE_INSENSITIVE_ORDER));
        }
        return map;
    }

    private void replaceUserRoles(User user, List<Long> roleIds) {
        userRoleRepository.deleteByUserId(user.getId());
        if (roleIds == null || roleIds.isEmpty()) {
            return;
        }
        LinkedHashSet<Long> unique = roleIds.stream()
                .filter(Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (unique.isEmpty()) {
            return;
        }
        List<Role> roles = roleRepository.findAllById(unique);
        if (roles.size() != unique.size()) {
            throw new IllegalArgumentException("Một hoặc nhiều vai trò (role) không tồn tại");
        }
        Map<Long, Role> byId = roles.stream().collect(Collectors.toMap(Role::getId, r -> r));
        for (Long rid : unique) {
            Role role = byId.get(rid);
            UserRole link = new UserRole();
            link.setId(new UserRoleId());
            link.setUser(user);
            link.setRole(role);
            userRoleRepository.save(link);
        }
    }

    private static UserRoleSummary toRoleSummary(Role role) {
        UserRoleSummary s = new UserRoleSummary();
        s.setId(role.getId());
        s.setRoleCode(role.getRoleCode());
        s.setRoleName(role.getRoleName());
        return s;
    }

    private static void applyProfile(
            User user,
            String phoneNumber,
            String fullName,
            LocalDate dob,
            String gender,
            String cccd,
            String passport,
            String address,
            String currentAddress,
            String personalEmail,
            String avatarUrl,
            String nationality,
            String ethnicity,
            String maritalStatus) {
        user.setPhoneNumber(trimToNull(phoneNumber));
        user.setFullName(fullName == null ? "" : fullName.trim());
        user.setDob(dob);
        user.setGender(trimToNull(gender));
        user.setCccd(trimToNull(cccd));
        user.setPassport(trimToNull(passport));
        user.setAddress(trimToNull(address));
        user.setCurrentAddress(trimToNull(currentAddress));
        user.setPersonalEmail(trimToNull(personalEmail));
        user.setAvatarUrl(trimToNull(avatarUrl));
        user.setNationality(trimToNull(nationality));
        user.setEthnicity(trimToNull(ethnicity));
        user.setMaritalStatus(trimToNull(maritalStatus));
    }

    private static String normalizeUsername(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private static String normalizeEmail(String raw) {
        return raw == null ? "" : raw.trim().toLowerCase();
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private UserResponse toResponse(User user, List<UserRoleSummary> roles) {
        UserResponse dto = new UserResponse();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setPhoneNumber(user.getPhoneNumber());
        dto.setStatus(user.getStatus());
        dto.setFullName(user.getFullName());
        dto.setDob(user.getDob());
        dto.setGender(user.getGender());
        dto.setCccd(user.getCccd());
        dto.setPassport(user.getPassport());
        dto.setAddress(user.getAddress());
        dto.setCurrentAddress(user.getCurrentAddress());
        dto.setPersonalEmail(user.getPersonalEmail());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setNationality(user.getNationality());
        dto.setEthnicity(user.getEthnicity());
        dto.setMaritalStatus(user.getMaritalStatus());
        dto.setIsEmailVerified(user.getIsEmailVerified());
        dto.setIsPhoneVerified(user.getIsPhoneVerified());
        dto.setLastLoginAt(user.getLastLoginAt());
        dto.setLastLoginIp(user.getLastLoginIp());
        dto.setFailedLoginCount(user.getFailedLoginCount());
        dto.setLockoutEnd(user.getLockoutEnd());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setCreatedBy(user.getCreatedBy());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setUpdatedBy(user.getUpdatedBy());
        dto.setRoles(roles);
        return dto;
    }
}
