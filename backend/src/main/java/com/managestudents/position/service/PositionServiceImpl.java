package com.managestudents.position.service;

import com.managestudents.common.exception.DuplicateResourceFieldException;
import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.position.dto.PositionCreateRequest;
import com.managestudents.position.dto.PositionResponse;
import com.managestudents.position.dto.PositionUpdateRequest;
import com.managestudents.position.entity.Position;
import com.managestudents.position.repository.PositionRepository;
import com.managestudents.position.repository.PositionSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PositionServiceImpl implements PositionService {

    private final PositionRepository positionRepository;

    public PositionServiceImpl(PositionRepository positionRepository) {
        this.positionRepository = positionRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PositionResponse> findAll(String keyword, String positionCategory, Pageable pageable) {
        Page<Position> page = positionRepository.findAll(
                PositionSpecifications.filter(keyword, positionCategory),
                pageable);
        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> listDistinctPositionCategories() {
        return positionRepository.findDistinctPositionCategories();
    }

    @Override
    @Transactional(readOnly = true)
    public PositionResponse findById(Long id) {
        Position entity = positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chức vụ"));
        return toResponse(entity);
    }

    @Override
    @Transactional
    public PositionResponse create(PositionCreateRequest request) {
        String code = normalize(request.getPositionCode());
        if (positionRepository.existsByPositionCode(code)) {
            throw new DuplicateResourceFieldException("positionCode", "Mã chức vụ đã tồn tại");
        }
        Position p = new Position();
        apply(p, code, request.getPositionName(), request.getPositionCategory(), request.getDescription());
        return toResponse(positionRepository.save(p));
    }

    @Override
    @Transactional
    public PositionResponse update(Long id, PositionUpdateRequest request) {
        Position p = positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chức vụ"));
        String code = normalize(request.getPositionCode());
        if (positionRepository.existsByPositionCodeAndIdNot(code, id)) {
            throw new DuplicateResourceFieldException("positionCode", "Mã chức vụ đã tồn tại");
        }
        apply(p, code, request.getPositionName(), request.getPositionCategory(), request.getDescription());
        return toResponse(positionRepository.save(p));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!positionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy chức vụ");
        }
        positionRepository.deleteById(id);
    }

    private static String normalize(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private static void apply(Position p, String code, String name, String positionCategory, String description) {
        p.setPositionCode(code);
        p.setPositionName(name == null ? "" : name.trim());
        p.setPositionCategory(trimToNull(positionCategory));
        p.setDescription(trimToNull(description));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private PositionResponse toResponse(Position p) {
        PositionResponse dto = new PositionResponse();
        dto.setId(p.getId());
        dto.setPositionCode(p.getPositionCode());
        dto.setPositionName(p.getPositionName());
        dto.setPositionCategory(p.getPositionCategory());
        dto.setDescription(p.getDescription());
        dto.setCreatedAt(p.getCreatedAt());
        dto.setUpdatedAt(p.getUpdatedAt());
        return dto;
    }
}
