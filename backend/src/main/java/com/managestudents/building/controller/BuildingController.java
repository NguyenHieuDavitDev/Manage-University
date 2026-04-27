package com.managestudents.building.controller;

import com.managestudents.building.dto.BuildingCreateRequest;
import com.managestudents.building.dto.BuildingResponse;
import com.managestudents.building.dto.BuildingUpdateRequest;
import com.managestudents.building.service.BuildingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/buildings")
public class BuildingController {

    private final BuildingService buildingService;

    public BuildingController(BuildingService buildingService) {
        this.buildingService = buildingService;
    }

    @GetMapping
    public ResponseEntity<Page<BuildingResponse>> list(
            @RequestParam(name = "q", required = false) String keyword,
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(buildingService.findAll(keyword, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BuildingResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(buildingService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<BuildingResponse> create(@Valid @RequestBody BuildingCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(buildingService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BuildingResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody BuildingUpdateRequest request) {
        return ResponseEntity.ok(buildingService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        buildingService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
