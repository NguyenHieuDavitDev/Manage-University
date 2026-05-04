package com.managestudents.trainingprogram.service;

import com.managestudents.common.exception.DuplicateResourceFieldException;
import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.trainingprogram.dto.TrainingProgramCreateRequest;
import com.managestudents.trainingprogram.dto.TrainingProgramResponse;
import com.managestudents.trainingprogram.dto.TrainingProgramUpdateRequest;
import com.managestudents.trainingprogram.entity.TrainingProgram;
import com.managestudents.trainingprogram.repository.TrainingProgramRepository;
import com.managestudents.trainingprogram.repository.TrainingProgramSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TrainingProgramServiceImpl implements TrainingProgramService {

    private final TrainingProgramRepository trainingProgramRepository;

    public TrainingProgramServiceImpl(TrainingProgramRepository trainingProgramRepository) {
        this.trainingProgramRepository = trainingProgramRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TrainingProgramResponse> findAll(String keyword, Pageable pageable) {
        Page<TrainingProgram> page;
        if (keyword == null || keyword.isBlank()) {
            page = trainingProgramRepository.findAll(pageable);
        } else {
            Specification<TrainingProgram> spec = TrainingProgramSpecifications.matchesKeyword(keyword);
            page = trainingProgramRepository.findAll(spec, pageable);
        }
        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public TrainingProgramResponse findById(Long id) {
        TrainingProgram entity = trainingProgramRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chương trình đào tạo"));
        return toResponse(entity);
    }

    @Override
    @Transactional
    public TrainingProgramResponse create(TrainingProgramCreateRequest request) {
        String code = normalize(request.getProgramCode());
        if (trainingProgramRepository.existsByProgramCode(code)) {
            throw new DuplicateResourceFieldException("programCode", "Mã chương trình đã tồn tại");
        }
        TrainingProgram e = new TrainingProgram();
        apply(e, code, request.getProgramName(), request.getTotalCredits(), request.getDescription());
        return toResponse(trainingProgramRepository.save(e));
    }

    @Override
    @Transactional
    public TrainingProgramResponse update(Long id, TrainingProgramUpdateRequest request) {
        TrainingProgram e = trainingProgramRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chương trình đào tạo"));
        String code = normalize(request.getProgramCode());
        if (trainingProgramRepository.existsByProgramCodeAndIdNot(code, id)) {
            throw new DuplicateResourceFieldException("programCode", "Mã chương trình đã tồn tại");
        }
        apply(e, code, request.getProgramName(), request.getTotalCredits(), request.getDescription());
        return toResponse(trainingProgramRepository.save(e));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!trainingProgramRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy chương trình đào tạo");
        }
        trainingProgramRepository.deleteById(id);
    }

    private static String normalize(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private static void apply(TrainingProgram e, String code, String name, Integer totalCredits, String description) {
        e.setProgramCode(code);
        e.setProgramName(name == null ? "" : name.trim());
        e.setTotalCredits(totalCredits);
        e.setDescription(trimToNull(description));
    }

    private TrainingProgramResponse toResponse(TrainingProgram e) {
        TrainingProgramResponse dto = new TrainingProgramResponse();
        dto.setId(e.getId());
        dto.setProgramCode(e.getProgramCode());
        dto.setProgramName(e.getProgramName());
        dto.setTotalCredits(e.getTotalCredits());
        dto.setDescription(e.getDescription());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }
}
