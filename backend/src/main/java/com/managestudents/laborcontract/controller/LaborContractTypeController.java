package com.managestudents.laborcontract.controller;

import com.managestudents.laborcontract.service.LaborContractService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/labor-contract-types")
public class LaborContractTypeController {

    private final LaborContractService laborContractService;

    public LaborContractTypeController(LaborContractService laborContractService) {
        this.laborContractService = laborContractService;
    }

    @GetMapping
    public ResponseEntity<List<String>> list() {
        return ResponseEntity.ok(laborContractService.listDistinctContractTypes());
    }
}
