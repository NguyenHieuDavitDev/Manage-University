package com.managestudents.position.service;

import com.managestudents.position.dto.PositionCreateRequest;
import com.managestudents.position.dto.PositionResponse;
import com.managestudents.position.dto.PositionUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PositionService {

    Page<PositionResponse> findAll(String keyword, String positionCategory, Pageable pageable);

    List<String> listDistinctPositionCategories();

    PositionResponse findById(Long id);

    PositionResponse create(PositionCreateRequest request);

    PositionResponse update(Long id, PositionUpdateRequest request);

    void deleteById(Long id);
}
