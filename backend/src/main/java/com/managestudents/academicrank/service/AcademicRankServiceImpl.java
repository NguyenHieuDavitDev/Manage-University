package com.managestudents.academicrank.service;

import com.managestudents.academicrank.dto.AcademicRankCreateRequest;
import com.managestudents.academicrank.dto.AcademicRankResponse;
import com.managestudents.academicrank.dto.AcademicRankUpdateRequest;
import com.managestudents.academicrank.entity.AcademicRank;
import com.managestudents.academicrank.repository.AcademicRankRepository;
import com.managestudents.academicrank.repository.AcademicRankSpecifications;
import com.managestudents.common.exception.DuplicateResourceFieldException;
import com.managestudents.common.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AcademicRankServiceImpl implements AcademicRankService {

    private final AcademicRankRepository academicRankRepository;

    public AcademicRankServiceImpl(AcademicRankRepository academicRankRepository) {
        this.academicRankRepository = academicRankRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AcademicRankResponse> findAll(String keyword, Pageable pageable) {
        Page<AcademicRank> page;
        if (keyword == null || keyword.isBlank()) {
            page = academicRankRepository.findAll(pageable);
        } else {
            Specification<AcademicRank> spec = AcademicRankSpecifications.matchesKeyword(keyword);
            page = academicRankRepository.findAll(spec, pageable);
        }
        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AcademicRankResponse findById(Long id) {
        AcademicRank entity = academicRankRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hàm học vị"));
        return toResponse(entity);
    }

    @Override
    @Transactional
    public AcademicRankResponse create(AcademicRankCreateRequest request) {
        String code = normalize(request.getRankCode());
        if (academicRankRepository.existsByRankCode(code)) {
            throw new DuplicateResourceFieldException("rankCode", "Mã hàm học vị đã tồn tại");
        }
        AcademicRank r = new AcademicRank();
        apply(r, code, request.getRankName(), request.getDescription());
        return toResponse(academicRankRepository.save(r));
    }

    @Override
    @Transactional
    public AcademicRankResponse update(Long id, AcademicRankUpdateRequest request) {
        AcademicRank r = academicRankRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hàm học vị"));
        String code = normalize(request.getRankCode());
        if (academicRankRepository.existsByRankCodeAndIdNot(code, id)) {
            throw new DuplicateResourceFieldException("rankCode", "Mã hàm học vị đã tồn tại");
        }
        apply(r, code, request.getRankName(), request.getDescription());
        return toResponse(academicRankRepository.save(r));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!academicRankRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy hàm học vị");
        }
        academicRankRepository.deleteById(id);
    }

    private static String normalize(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private static void apply(AcademicRank r, String code, String name, String description) {
        r.setRankCode(code);
        r.setRankName(name == null ? "" : name.trim());
        r.setDescription(trimToNull(description));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private AcademicRankResponse toResponse(AcademicRank r) {
        AcademicRankResponse dto = new AcademicRankResponse();
        dto.setId(r.getId());
        dto.setRankCode(r.getRankCode());
        dto.setRankName(r.getRankName());
        dto.setDescription(r.getDescription());
        dto.setCreatedAt(r.getCreatedAt());
        dto.setUpdatedAt(r.getUpdatedAt());
        return dto;
    }
}
