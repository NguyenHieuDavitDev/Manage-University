package com.managestudents.insurance.controller;

import com.managestudents.insurance.dto.InsuranceCreateRequest;
import com.managestudents.insurance.dto.InsuranceResponse;
import com.managestudents.insurance.dto.InsuranceUpdateRequest;
import com.managestudents.insurance.service.InsuranceService;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/insurances")
public class InsuranceController {

    private final InsuranceService insuranceService;

    public InsuranceController(InsuranceService insuranceService) {
        this.insuranceService = insuranceService;
    }

    @GetMapping
    public ResponseEntity<Page<InsuranceResponse>> list(
            @RequestParam(name = "userId", required = false) UUID userId,
            @RequestParam(name = "q", required = false) String keyword,
            @RequestParam(name = "insuranceType", required = false) String insuranceType,
            @PageableDefault(size = 20, sort = "id,desc") Pageable pageable) {
        return ResponseEntity.ok(insuranceService.findAll(userId, keyword, insuranceType, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InsuranceResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(insuranceService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<InsuranceResponse> create(@Valid @RequestBody InsuranceCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(insuranceService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InsuranceResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody InsuranceUpdateRequest request) {
        return ResponseEntity.ok(insuranceService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        insuranceService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
