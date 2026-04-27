package com.managestudents.building.service;

import com.managestudents.building.dto.BuildingCreateRequest;
import com.managestudents.building.dto.BuildingResponse;
import com.managestudents.building.dto.BuildingUpdateRequest;
import com.managestudents.building.entity.Building;
import com.managestudents.building.repository.BuildingRepository;
import com.managestudents.building.repository.BuildingSpecifications;
import com.managestudents.common.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BuildingServiceImpl implements BuildingService {

    private final BuildingRepository buildingRepository;

    public BuildingServiceImpl(BuildingRepository buildingRepository) {
        this.buildingRepository = buildingRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BuildingResponse> findAll(String keyword, Pageable pageable) {
        Page<Building> page;
        if (keyword == null || keyword.isBlank()) {
            page = buildingRepository.findAll(pageable);
        } else {
            Specification<Building> spec = BuildingSpecifications.matchesKeyword(keyword);
            page = buildingRepository.findAll(spec, pageable);
        }
        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public BuildingResponse findById(Long id) {
        Building entity = buildingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tòa nhà"));
        return toResponse(entity);
    }

    @Override
    @Transactional
    public BuildingResponse create(BuildingCreateRequest request) {
        Building b = new Building();
        apply(b, nextBuildingCode(), request.getBuildingName(), request.getDescription());
        return toResponse(buildingRepository.save(b));
    }

    @Override
    @Transactional
    public BuildingResponse update(Long id, BuildingUpdateRequest request) {
        Building b = buildingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tòa nhà"));
        apply(b, b.getBuildingCode(), request.getBuildingName(), request.getDescription());
        return toResponse(buildingRepository.save(b));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!buildingRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy tòa nhà");
        }
        buildingRepository.deleteById(id);
    }

    private String nextBuildingCode() {
        final String prefix = "TN";
        int seq = 1;
        while (true) {
            String candidate = prefix + String.format("%03d", seq);
            if (!buildingRepository.existsByBuildingCode(candidate)) {
                return candidate;
            }
            seq++;
        }
    }

    private static void apply(Building b, String code, String name, String description) {
        b.setBuildingCode(code);
        b.setBuildingName(name == null ? "" : name.trim());
        b.setDescription(trimToNull(description));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private BuildingResponse toResponse(Building b) {
        BuildingResponse dto = new BuildingResponse();
        dto.setId(b.getId());
        dto.setBuildingCode(b.getBuildingCode());
        dto.setBuildingName(b.getBuildingName());
        dto.setDescription(b.getDescription());
        dto.setCreatedAt(b.getCreatedAt());
        dto.setUpdatedAt(b.getUpdatedAt());
        return dto;
    }
}
