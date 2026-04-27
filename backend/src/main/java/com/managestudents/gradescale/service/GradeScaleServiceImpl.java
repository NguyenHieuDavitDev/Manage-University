package com.managestudents.gradescale.service;

import com.managestudents.common.exception.DuplicateResourceFieldException;
import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.gradescale.dto.GradeScaleCreateRequest;
import com.managestudents.gradescale.dto.GradeScaleResponse;
import com.managestudents.gradescale.dto.GradeScaleUpdateRequest;
import com.managestudents.gradescale.entity.GradeScale;
import com.managestudents.gradescale.repository.GradeScaleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class GradeScaleServiceImpl implements GradeScaleService {

    private final GradeScaleRepository gradeScaleRepository;

    public GradeScaleServiceImpl(GradeScaleRepository gradeScaleRepository) {
        this.gradeScaleRepository = gradeScaleRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<GradeScaleResponse> listAll() {
        return gradeScaleRepository.findAllByOrderByMinScoreDesc().stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public GradeScaleResponse create(GradeScaleCreateRequest request) {
        String letter = normalizeLetter(request.getLetterGrade());
        validateRange(request.getMinScore(), request.getMaxScore());
        if (gradeScaleRepository.existsByLetterGrade(letter)) {
            throw new DuplicateResourceFieldException("letterGrade", "Ký tự xếp loại đã tồn tại");
        }
        GradeScale e = new GradeScale();
        apply(e, letter, request.getMinScore(), request.getMaxScore(), request.getDescription());
        return toResponse(gradeScaleRepository.save(e));
    }

    @Override
    @Transactional
    public GradeScaleResponse update(Long id, GradeScaleUpdateRequest request) {
        GradeScale e = gradeScaleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thang điểm"));
        String letter = normalizeLetter(request.getLetterGrade());
        validateRange(request.getMinScore(), request.getMaxScore());
        if (gradeScaleRepository.existsByLetterGradeAndIdNot(letter, id)) {
            throw new DuplicateResourceFieldException("letterGrade", "Ký tự xếp loại đã tồn tại");
        }
        apply(e, letter, request.getMinScore(), request.getMaxScore(), request.getDescription());
        return toResponse(gradeScaleRepository.save(e));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!gradeScaleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy thang điểm");
        }
        gradeScaleRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public String classify(BigDecimal score) {
        if (score == null) return null;
        List<GradeScale> scales = gradeScaleRepository.findAllByOrderByMinScoreDesc();
        for (GradeScale s : scales) {
            if (score.compareTo(s.getMinScore()) >= 0 && score.compareTo(s.getMaxScore()) <= 0) {
                return s.getLetterGrade();
            }
        }
        return null;
    }

    private static void apply(GradeScale e, String letter, BigDecimal min, BigDecimal max, String description) {
        e.setLetterGrade(letter);
        e.setMinScore(min);
        e.setMaxScore(max);
        e.setDescription(trimToNull(description));
    }

    private static void validateRange(BigDecimal min, BigDecimal max) {
        if (min == null || max == null) {
            throw new IllegalArgumentException("Khoảng điểm không hợp lệ");
        }
        if (min.compareTo(max) > 0) {
            throw new IllegalArgumentException("Điểm min phải nhỏ hơn hoặc bằng điểm max");
        }
    }

    private static String normalizeLetter(String raw) {
        return raw == null ? "" : raw.trim().toUpperCase();
    }

    private static String trimToNull(String v) {
        if (v == null) return null;
        String t = v.trim();
        return t.isEmpty() ? null : t;
    }

    private GradeScaleResponse toResponse(GradeScale e) {
        GradeScaleResponse dto = new GradeScaleResponse();
        dto.setId(e.getId());
        dto.setLetterGrade(e.getLetterGrade());
        dto.setMinScore(e.getMinScore());
        dto.setMaxScore(e.getMaxScore());
        dto.setDescription(e.getDescription());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }
}
