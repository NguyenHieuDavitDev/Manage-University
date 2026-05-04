package com.managestudents.tuitionrate.service;

import com.managestudents.common.exception.DuplicateResourceFieldException;
import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.trainingprogram.entity.TrainingProgram;
import com.managestudents.trainingprogram.repository.TrainingProgramRepository;
import com.managestudents.tuitionrate.dto.TuitionRateCreateRequest;
import com.managestudents.tuitionrate.dto.TuitionRateResponse;
import com.managestudents.tuitionrate.dto.TuitionRateUpdateRequest;
import com.managestudents.tuitionrate.entity.TuitionRate;
import com.managestudents.tuitionrate.repository.TuitionRateRepository;
import com.managestudents.tuitionrate.repository.TuitionRateSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
public class TuitionRateServiceImpl implements TuitionRateService {

    private final TuitionRateRepository tuitionRateRepository;
    private final TrainingProgramRepository trainingProgramRepository;

    public TuitionRateServiceImpl(
            TuitionRateRepository tuitionRateRepository,
            TrainingProgramRepository trainingProgramRepository) {
        this.tuitionRateRepository = tuitionRateRepository;
        this.trainingProgramRepository = trainingProgramRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TuitionRateResponse> findAll(String keyword, Pageable pageable) {
        Page<TuitionRate> page;
        if (keyword == null || keyword.isBlank()) {
            page = tuitionRateRepository.findAll(pageable);
        } else {
            Specification<TuitionRate> spec = TuitionRateSpecifications.matchesKeyword(keyword);
            page = tuitionRateRepository.findAll(spec, pageable);
        }
        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public TuitionRateResponse findById(Long id) {
        TuitionRate entity = tuitionRateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mức học phí"));
        return toResponse(entity);
    }

    @Override
    @Transactional
    public TuitionRateResponse create(TuitionRateCreateRequest request) {
        String code = normalize(request.getTuitionCode());
        if (tuitionRateRepository.existsByTuitionCode(code)) {
            throw new DuplicateResourceFieldException("tuitionCode", "Mã mức học phí đã tồn tại");
        }
        TrainingProgram program = trainingProgramRepository.findById(request.getTrainingProgramId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chương trình đào tạo"));
        validateFeeFields(request.getFeePerCredit());
        TuitionRate entity = new TuitionRate();
        apply(entity, code, request.getTuitionName(), program, request.getFeePerCredit(), request.getDescription());
        return toResponse(tuitionRateRepository.save(entity));
    }

    @Override
    @Transactional
    public TuitionRateResponse update(Long id, TuitionRateUpdateRequest request) {
        TuitionRate entity = tuitionRateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mức học phí"));
        String code = normalize(request.getTuitionCode());
        if (tuitionRateRepository.existsByTuitionCodeAndIdNot(code, id)) {
            throw new DuplicateResourceFieldException("tuitionCode", "Mã mức học phí đã tồn tại");
        }
        TrainingProgram program = trainingProgramRepository.findById(request.getTrainingProgramId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chương trình đào tạo"));
        validateFeeFields(request.getFeePerCredit());
        apply(entity, code, request.getTuitionName(), program, request.getFeePerCredit(), request.getDescription());
        return toResponse(tuitionRateRepository.save(entity));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!tuitionRateRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy mức học phí");
        }
        tuitionRateRepository.deleteById(id);
    }

    private static String normalize(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private static void validateFeeFields(BigDecimal feePerCredit) {
        if (feePerCredit == null || feePerCredit.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Đơn giá theo tín chỉ phải lớn hơn 0");
        }
    }

    private static void apply(
            TuitionRate entity,
            String code,
            String name,
            TrainingProgram trainingProgram,
            BigDecimal feePerCredit,
            String description) {
        entity.setTuitionCode(code);
        entity.setTuitionName(name == null ? "" : name.trim());
        entity.setTrainingProgram(trainingProgram);
        entity.setFeePerCredit(feePerCredit);
        entity.setDescription(trimToNull(description));
    }

    private static BigDecimal computeTotalTuition(TrainingProgram program, BigDecimal feePerCredit) {
        if (program == null || feePerCredit == null || program.getTotalCredits() == null) {
            return null;
        }
        return feePerCredit.multiply(BigDecimal.valueOf(program.getTotalCredits()));
    }

    private TuitionRateResponse toResponse(TuitionRate e) {
        TuitionRateResponse dto = new TuitionRateResponse();
        dto.setId(e.getId());
        dto.setTuitionCode(e.getTuitionCode());
        dto.setTuitionName(e.getTuitionName());
        if (e.getTrainingProgram() != null) {
            dto.setTrainingProgramId(e.getTrainingProgram().getId());
            dto.setTrainingProgramCode(e.getTrainingProgram().getProgramCode());
            dto.setTrainingProgramName(e.getTrainingProgram().getProgramName());
            dto.setTrainingProgramTotalCredits(e.getTrainingProgram().getTotalCredits());
        }
        dto.setFeePerCredit(e.getFeePerCredit());
        dto.setTotalTuition(computeTotalTuition(e.getTrainingProgram(), e.getFeePerCredit()));
        dto.setDescription(e.getDescription());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }
}
