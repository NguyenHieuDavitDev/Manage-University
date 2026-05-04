package com.managestudents.tuitionrate.controller;

import com.managestudents.tuitionrate.dto.TuitionRateCreateRequest;
import com.managestudents.tuitionrate.dto.TuitionRateResponse;
import com.managestudents.tuitionrate.dto.TuitionRateUpdateRequest;
import com.managestudents.tuitionrate.service.TuitionRateService;
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
@RequestMapping("/api/v1/tuition-rates")
public class TuitionRateController {

    private final TuitionRateService tuitionRateService;

    public TuitionRateController(TuitionRateService tuitionRateService) {
        this.tuitionRateService = tuitionRateService;
    }

    @GetMapping
    public ResponseEntity<Page<TuitionRateResponse>> list(
            @RequestParam(name = "q", required = false) String keyword,
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return ResponseEntity.ok(tuitionRateService.findAll(keyword, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TuitionRateResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(tuitionRateService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<TuitionRateResponse> create(@Valid @RequestBody TuitionRateCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tuitionRateService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TuitionRateResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TuitionRateUpdateRequest request) {
        return ResponseEntity.ok(tuitionRateService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tuitionRateService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
