package com.managestudents.building.service;

import com.managestudents.building.dto.BuildingCreateRequest;
import com.managestudents.building.dto.BuildingResponse;
import com.managestudents.building.dto.BuildingUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BuildingService {

    Page<BuildingResponse> findAll(String keyword, Pageable pageable);

    BuildingResponse findById(Long id);

    BuildingResponse create(BuildingCreateRequest request);

    BuildingResponse update(Long id, BuildingUpdateRequest request);

    void deleteById(Long id);
}
