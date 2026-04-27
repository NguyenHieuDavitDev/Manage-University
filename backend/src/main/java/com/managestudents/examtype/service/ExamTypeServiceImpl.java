package com.managestudents.examtype.service;

import com.managestudents.common.exception.DuplicateResourceFieldException;
import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.examtype.dto.ExamTypeCreateRequest;
import com.managestudents.examtype.dto.ExamTypeResponse;
import com.managestudents.examtype.dto.ExamTypeUpdateRequest;
import com.managestudents.examtype.entity.ExamType;
import com.managestudents.examtype.repository.ExamTypeRepository;
import com.managestudents.examtype.repository.ExamTypeSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExamTypeServiceImpl implements ExamTypeService {

    private final ExamTypeRepository examTypeRepository;

    public ExamTypeServiceImpl(ExamTypeRepository examTypeRepository) {
        this.examTypeRepository = examTypeRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ExamTypeResponse> findAll(String keyword, Pageable pageable) {
        Page<ExamType> page;
        if (keyword == null || keyword.isBlank()) {
            page = examTypeRepository.findAll(pageable);
        } else {
            Specification<ExamType> spec = ExamTypeSpecifications.matchesKeyword(keyword);
            page = examTypeRepository.findAll(spec, pageable);
        }
        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public ExamTypeResponse findById(Long id) {
        ExamType entity = examTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại kỳ thi"));
        return toResponse(entity);
    }

    @Override
    @Transactional
    public ExamTypeResponse create(ExamTypeCreateRequest request) {
        String code = normalize(request.getExamTypeCode());
        if (examTypeRepository.existsByExamTypeCode(code)) {
            throw new DuplicateResourceFieldException("examTypeCode", "Mã loại kỳ thi đã tồn tại");
        }
        ExamType e = new ExamType();
        apply(e, code, request.getExamTypeName(), request.getDescription());
        return toResponse(examTypeRepository.save(e));
    }

    @Override
    @Transactional
    public ExamTypeResponse update(Long id, ExamTypeUpdateRequest request) {
        ExamType e = examTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại kỳ thi"));
        String code = normalize(request.getExamTypeCode());
        if (examTypeRepository.existsByExamTypeCodeAndIdNot(code, id)) {
            throw new DuplicateResourceFieldException("examTypeCode", "Mã loại kỳ thi đã tồn tại");
        }
        apply(e, code, request.getExamTypeName(), request.getDescription());
        return toResponse(examTypeRepository.save(e));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!examTypeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy loại kỳ thi");
        }
        examTypeRepository.deleteById(id);
    }

    private static String normalize(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private static void apply(ExamType e, String code, String name, String description) {
        e.setExamTypeCode(code);
        e.setExamTypeName(name == null ? "" : name.trim());
        e.setDescription(trimToNull(description));
    }

    private ExamTypeResponse toResponse(ExamType e) {
        ExamTypeResponse dto = new ExamTypeResponse();
        dto.setId(e.getId());
        dto.setExamTypeCode(e.getExamTypeCode());
        dto.setExamTypeName(e.getExamTypeName());
        dto.setDescription(e.getDescription());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }
}
