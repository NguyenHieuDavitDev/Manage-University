package com.managestudents.position.controller;

import com.managestudents.position.dto.PositionCreateRequest;
import com.managestudents.position.dto.PositionResponse;
import com.managestudents.position.dto.PositionUpdateRequest;
import com.managestudents.position.service.PositionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
@RequestMapping("/api/v1/positions")
public class PositionController {

    private final PositionService positionService;

    public PositionController(PositionService positionService) {
        this.positionService = positionService;
    }

    @GetMapping
    public ResponseEntity<Page<PositionResponse>> list(
            @RequestParam(name = "q", required = false) String keyword,
            @RequestParam(name = "positionCategory", required = false) String positionCategory,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(positionService.findAll(keyword, positionCategory, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PositionResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(positionService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<PositionResponse> create(@Valid @RequestBody PositionCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(positionService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PositionResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody PositionUpdateRequest request) {
        return ResponseEntity.ok(positionService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        positionService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
