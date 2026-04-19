package com.managestudents.laborcontract.controller;

import com.managestudents.laborcontract.dto.LaborContractCreateRequest;
import com.managestudents.laborcontract.dto.LaborContractResponse;
import com.managestudents.laborcontract.dto.LaborContractUpdateRequest;
import com.managestudents.laborcontract.service.LaborContractService;
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
@RequestMapping("/api/v1/labor-contracts")
public class LaborContractController {

    private final LaborContractService laborContractService;

    public LaborContractController(LaborContractService laborContractService) {
        this.laborContractService = laborContractService;
    }

    @GetMapping
    public ResponseEntity<Page<LaborContractResponse>> list(
            @RequestParam(name = "userId", required = false) UUID userId,
            @RequestParam(name = "q", required = false) String keyword,
            @RequestParam(name = "contractType", required = false) String contractType,
            @PageableDefault(size = 20, sort = "id,desc") Pageable pageable) {
        return ResponseEntity.ok(laborContractService.findAll(userId, keyword, contractType, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LaborContractResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(laborContractService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<LaborContractResponse> create(@Valid @RequestBody LaborContractCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(laborContractService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LaborContractResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody LaborContractUpdateRequest request) {
        return ResponseEntity.ok(laborContractService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        laborContractService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
