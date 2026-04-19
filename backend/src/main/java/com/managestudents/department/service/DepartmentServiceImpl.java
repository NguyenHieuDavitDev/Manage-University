package com.managestudents.department.service;

import com.managestudents.common.exception.DuplicateResourceFieldException;
import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.department.dto.DepartmentCreateRequest;
import com.managestudents.department.dto.DepartmentResponse;
import com.managestudents.department.dto.DepartmentUpdateRequest;
import com.managestudents.department.entity.Department;
import com.managestudents.department.repository.DepartmentRepository;
import com.managestudents.department.repository.DepartmentSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentServiceImpl(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DepartmentResponse> findAll(String keyword, Pageable pageable) {
        Page<Department> page;
        if (keyword == null || keyword.isBlank()) {
            page = departmentRepository.findAll(pageable);
        } else {
            Specification<Department> spec = DepartmentSpecifications.matchesKeyword(keyword);
            page = departmentRepository.findAll(spec, pageable);
        }
        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public DepartmentResponse findById(Long id) {
        Department entity = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng ban"));
        return toResponse(entity);
    }

    @Override
    @Transactional
    public DepartmentResponse create(DepartmentCreateRequest request) {
        String code = normalize(request.getDepartmentCode());
        if (departmentRepository.existsByDepartmentCode(code)) {
            throw new DuplicateResourceFieldException("departmentCode", "Mã phòng ban đã tồn tại");
        }
        Department d = new Department();
        apply(d, code, request.getDepartmentName(), request.getDescription());
        return toResponse(departmentRepository.save(d));
    }

    @Override
    @Transactional
    public DepartmentResponse update(Long id, DepartmentUpdateRequest request) {
        Department d = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng ban"));
        String code = normalize(request.getDepartmentCode());
        if (departmentRepository.existsByDepartmentCodeAndIdNot(code, id)) {
            throw new DuplicateResourceFieldException("departmentCode", "Mã phòng ban đã tồn tại");
        }
        apply(d, code, request.getDepartmentName(), request.getDescription());
        return toResponse(departmentRepository.save(d));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!departmentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy phòng ban");
        }
        departmentRepository.deleteById(id);
    }

    private static String normalize(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private static void apply(Department d, String code, String name, String description) {
        d.setDepartmentCode(code);
        d.setDepartmentName(name == null ? "" : name.trim());
        d.setDescription(trimToNull(description));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private DepartmentResponse toResponse(Department d) {
        DepartmentResponse dto = new DepartmentResponse();
        dto.setId(d.getId());
        dto.setDepartmentCode(d.getDepartmentCode());
        dto.setDepartmentName(d.getDepartmentName());
        dto.setDescription(d.getDescription());
        dto.setCreatedAt(d.getCreatedAt());
        dto.setUpdatedAt(d.getUpdatedAt());
        return dto;
    }
}
