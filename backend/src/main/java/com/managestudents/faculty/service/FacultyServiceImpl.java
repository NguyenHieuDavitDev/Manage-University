package com.managestudents.faculty.service;

import com.managestudents.common.exception.DuplicateResourceFieldException;
import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.faculty.dto.FacultyCreateRequest;
import com.managestudents.faculty.dto.FacultyResponse;
import com.managestudents.faculty.dto.FacultyUpdateRequest;
import com.managestudents.faculty.entity.Faculty;
import com.managestudents.faculty.repository.FacultyRepository;
import com.managestudents.faculty.repository.FacultySpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FacultyServiceImpl implements FacultyService {

    private final FacultyRepository facultyRepository;

    public FacultyServiceImpl(FacultyRepository facultyRepository) {
        this.facultyRepository = facultyRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<FacultyResponse> findAll(String keyword, Pageable pageable) {
        Page<Faculty> page;
        if (keyword == null || keyword.isBlank()) {
            page = facultyRepository.findAll(pageable);
        } else {
            Specification<Faculty> spec = FacultySpecifications.matchesKeyword(keyword);
            page = facultyRepository.findAll(spec, pageable);
        }
        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public FacultyResponse findById(Long id) {
        Faculty entity = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoa"));
        return toResponse(entity);
    }

    @Override
    @Transactional
    public FacultyResponse create(FacultyCreateRequest request) {
        String code = normalize(request.getFacultyCode());
        if (facultyRepository.existsByFacultyCode(code)) {
            throw new DuplicateResourceFieldException("facultyCode", "Mã khoa đã tồn tại");
        }
        Faculty f = new Faculty();
        apply(f, code, request.getFacultyName(), request.getDescription());
        return toResponse(facultyRepository.save(f));
    }

    @Override
    @Transactional
    public FacultyResponse update(Long id, FacultyUpdateRequest request) {
        Faculty f = facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoa"));
        String code = normalize(request.getFacultyCode());
        if (facultyRepository.existsByFacultyCodeAndIdNot(code, id)) {
            throw new DuplicateResourceFieldException("facultyCode", "Mã khoa đã tồn tại");
        }
        apply(f, code, request.getFacultyName(), request.getDescription());
        return toResponse(facultyRepository.save(f));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!facultyRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy khoa");
        }
        facultyRepository.deleteById(id);
    }

    private static String normalize(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private static void apply(Faculty f, String code, String name, String description) {
        f.setFacultyCode(code);
        f.setFacultyName(name == null ? "" : name.trim());
        f.setDescription(trimToNull(description));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private FacultyResponse toResponse(Faculty f) {
        FacultyResponse dto = new FacultyResponse();
        dto.setId(f.getId());
        dto.setFacultyCode(f.getFacultyCode());
        dto.setFacultyName(f.getFacultyName());
        dto.setDescription(f.getDescription());
        dto.setCreatedAt(f.getCreatedAt());
        dto.setUpdatedAt(f.getUpdatedAt());
        return dto;
    }
}
