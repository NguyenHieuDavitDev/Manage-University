package com.managestudents.dutyassignment.service;

import com.managestudents.common.exception.DuplicateResourceFieldException;
import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.department.repository.DepartmentRepository;
import com.managestudents.dutyassignment.dto.DutyAssignmentCreateRequest;
import com.managestudents.dutyassignment.dto.DutyAssignmentOrgRequest;
import com.managestudents.dutyassignment.dto.DutyAssignmentResponse;
import com.managestudents.dutyassignment.entity.DutyAssignment;
import com.managestudents.dutyassignment.repository.DutyAssignmentRepository;
import com.managestudents.dutyassignment.repository.DutyAssignmentSpecifications;
import com.managestudents.faculty.repository.FacultyRepository;
import com.managestudents.position.repository.PositionRepository;
import com.managestudents.user.entity.User;
import com.managestudents.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class DutyAssignmentServiceImpl implements DutyAssignmentService {

    private final DutyAssignmentRepository dutyAssignmentRepository;
    private final UserRepository userRepository;
    private final FacultyRepository facultyRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;

    public DutyAssignmentServiceImpl(
            DutyAssignmentRepository dutyAssignmentRepository,
            UserRepository userRepository,
            FacultyRepository facultyRepository,
            DepartmentRepository departmentRepository,
            PositionRepository positionRepository) {
        this.dutyAssignmentRepository = dutyAssignmentRepository;
        this.userRepository = userRepository;
        this.facultyRepository = facultyRepository;
        this.departmentRepository = departmentRepository;
        this.positionRepository = positionRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DutyAssignmentResponse> findAll(String keyword, Pageable pageable) {
        return dutyAssignmentRepository
                .findAll(DutyAssignmentSpecifications.filter(keyword), pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public DutyAssignmentResponse findById(Long id) {
        DutyAssignment e = dutyAssignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phân công nhiệm vụ"));
        return toResponse(e);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<DutyAssignmentResponse> findByUserId(UUID userId) {
        return dutyAssignmentRepository.findByUser_Id(userId).map(this::toResponse);
    }

    @Override
    @Transactional
    public DutyAssignmentResponse create(DutyAssignmentCreateRequest request) {
        UUID userId = request.getUserId();
        User user = userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        if (dutyAssignmentRepository.existsByUser_Id(userId)) {
            throw new DuplicateResourceFieldException("userId", "Người này đã có phân công nhiệm vụ");
        }
        DutyAssignment e = new DutyAssignment();
        e.setUser(user);
        applyOrg(e, request);
        return toResponse(dutyAssignmentRepository.save(e));
    }

    @Override
    @Transactional
    public DutyAssignmentResponse update(Long id, DutyAssignmentOrgRequest request) {
        DutyAssignment e = dutyAssignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phân công nhiệm vụ"));
        applyOrg(e, request);
        return toResponse(dutyAssignmentRepository.save(e));
    }

    @Override
    @Transactional
    public DutyAssignmentResponse upsertByUser(UUID userId, DutyAssignmentOrgRequest request) {
        User user = userRepository.findByIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));
        DutyAssignment e = dutyAssignmentRepository.findByUser_Id(userId).orElseGet(() -> {
            DutyAssignment n = new DutyAssignment();
            n.setUser(user);
            return n;
        });
        applyOrg(e, request);
        return toResponse(dutyAssignmentRepository.save(e));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!dutyAssignmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy phân công nhiệm vụ");
        }
        dutyAssignmentRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void deleteByUserId(UUID userId) {
        dutyAssignmentRepository.deleteByUser_Id(userId);
    }

    private void applyOrg(DutyAssignment e, DutyAssignmentOrgRequest request) {
        Long facultyId = request.getFacultyId();
        Long departmentId = request.getDepartmentId();
        Long positionId = request.getPositionId();
        if (facultyId != null && !facultyRepository.existsById(facultyId)) {
            throw new IllegalArgumentException("Khoa được chọn không tồn tại");
        }
        if (departmentId != null && !departmentRepository.existsById(departmentId)) {
            throw new IllegalArgumentException("Phòng ban được chọn không tồn tại");
        }
        if (positionId != null && !positionRepository.existsById(positionId)) {
            throw new IllegalArgumentException("Chức vụ được chọn không tồn tại");
        }
        e.setFaculty(facultyId == null ? null : facultyRepository.getReferenceById(facultyId));
        e.setDepartment(departmentId == null ? null : departmentRepository.getReferenceById(departmentId));
        e.setPosition(positionId == null ? null : positionRepository.getReferenceById(positionId));
    }

    private DutyAssignmentResponse toResponse(DutyAssignment e) {
        DutyAssignmentResponse dto = new DutyAssignmentResponse();
        dto.setId(e.getId());
        User u = e.getUser();
        dto.setUserId(u.getId());
        dto.setUsername(u.getUsername());
        dto.setFullName(u.getFullName());
        dto.setEmail(u.getEmail());
        if (e.getFaculty() != null) {
            dto.setFacultyId(e.getFaculty().getId());
            dto.setFacultyCode(e.getFaculty().getFacultyCode());
            dto.setFacultyName(e.getFaculty().getFacultyName());
        }
        if (e.getDepartment() != null) {
            dto.setDepartmentId(e.getDepartment().getId());
            dto.setDepartmentCode(e.getDepartment().getDepartmentCode());
            dto.setDepartmentName(e.getDepartment().getDepartmentName());
        }
        if (e.getPosition() != null) {
            dto.setPositionId(e.getPosition().getId());
            dto.setPositionCode(e.getPosition().getPositionCode());
            dto.setPositionName(e.getPosition().getPositionName());
        }
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }
}
