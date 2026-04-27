package com.managestudents.gradecomponent.service;

import com.managestudents.common.exception.DuplicateResourceFieldException;
import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.gradecomponent.dto.GradeComponentCreateRequest;
import com.managestudents.gradecomponent.dto.GradeComponentResponse;
import com.managestudents.gradecomponent.dto.GradeComponentUpdateRequest;
import com.managestudents.gradecomponent.entity.GradeComponent;
import com.managestudents.gradecomponent.repository.GradeComponentRepository;
import com.managestudents.gradecomponent.repository.GradeComponentSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GradeComponentServiceImpl implements GradeComponentService {

    private final GradeComponentRepository gradeComponentRepository;

    public GradeComponentServiceImpl(GradeComponentRepository gradeComponentRepository) {
        this.gradeComponentRepository = gradeComponentRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<GradeComponentResponse> findAll(String keyword, Pageable pageable) {
        Page<GradeComponent> page;
        if (keyword == null || keyword.isBlank()) {
            page = gradeComponentRepository.findAll(pageable);
        } else {
            Specification<GradeComponent> spec = GradeComponentSpecifications.matchesKeyword(keyword);
            page = gradeComponentRepository.findAll(spec, pageable);
        }
        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public GradeComponentResponse findById(Long id) {
        GradeComponent entity = gradeComponentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thành phần điểm"));
        return toResponse(entity);
    }

    @Override
    @Transactional
    public GradeComponentResponse create(GradeComponentCreateRequest request) {
        String code = normalize(request.getComponentCode());
        if (gradeComponentRepository.existsByComponentCode(code)) {
            throw new DuplicateResourceFieldException("componentCode", "Mã thành phần điểm đã tồn tại");
        }
        GradeComponent c = new GradeComponent();
        apply(c, code, request.getComponentName(), request.getDescription(), request.getWeightPercent());
        return toResponse(gradeComponentRepository.save(c));
    }

    @Override
    @Transactional
    public GradeComponentResponse update(Long id, GradeComponentUpdateRequest request) {
        GradeComponent c = gradeComponentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thành phần điểm"));
        String code = normalize(request.getComponentCode());
        if (gradeComponentRepository.existsByComponentCodeAndIdNot(code, id)) {
            throw new DuplicateResourceFieldException("componentCode", "Mã thành phần điểm đã tồn tại");
        }
        apply(c, code, request.getComponentName(), request.getDescription(), request.getWeightPercent());
        return toResponse(gradeComponentRepository.save(c));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!gradeComponentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy thành phần điểm");
        }
        gradeComponentRepository.deleteById(id);
    }

    private static String normalize(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private static void apply(GradeComponent c, String code, String name, String description, Integer weightPercent) {
        c.setComponentCode(code);
        c.setComponentName(name == null ? "" : name.trim());
        c.setDescription(trimToNull(description));
        c.setWeightPercent(weightPercent);
    }

    private GradeComponentResponse toResponse(GradeComponent c) {
        GradeComponentResponse dto = new GradeComponentResponse();
        dto.setId(c.getId());
        dto.setComponentCode(c.getComponentCode());
        dto.setComponentName(c.getComponentName());
        dto.setDescription(c.getDescription());
        dto.setWeightPercent(c.getWeightPercent());
        dto.setCreatedAt(c.getCreatedAt());
        dto.setUpdatedAt(c.getUpdatedAt());
        return dto;
    }
}
