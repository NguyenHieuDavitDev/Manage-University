package com.managestudents.insurance.controller;

import com.managestudents.insurance.service.InsuranceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/insurance-types")
public class InsuranceTypeController {

    private final InsuranceService insuranceService;

    public InsuranceTypeController(InsuranceService insuranceService) {
        this.insuranceService = insuranceService;
    }

    @GetMapping
    public ResponseEntity<List<String>> list() {
        return ResponseEntity.ok(insuranceService.listDistinctInsuranceTypes());
    }
}
