package com.managestudents.credential.controller;

import com.managestudents.credential.dto.CredentialCreateRequest;
import com.managestudents.credential.dto.CredentialResponse;
import com.managestudents.credential.dto.CredentialUpdateRequest;
import com.managestudents.credential.service.CredentialService;
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
@RequestMapping("/api/v1/credentials")
public class CredentialController {

    private final CredentialService credentialService;

    public CredentialController(CredentialService credentialService) {
        this.credentialService = credentialService;
    }

    @GetMapping
    public ResponseEntity<Page<CredentialResponse>> list(
            @RequestParam(name = "userId", required = false) UUID userId,
            @RequestParam(name = "q", required = false) String keyword,
            @RequestParam(name = "category", required = false) String category,
            @PageableDefault(size = 20, sort = "id,desc") Pageable pageable) {
        return ResponseEntity.ok(credentialService.findAll(userId, keyword, category, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CredentialResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(credentialService.findById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<CredentialResponse> create(@Valid @RequestBody CredentialCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(credentialService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CredentialResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody CredentialUpdateRequest request) {
        return ResponseEntity.ok(credentialService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        credentialService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
