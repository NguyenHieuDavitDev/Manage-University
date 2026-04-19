package com.managestudents.credential.controller;

import com.managestudents.credential.service.CredentialService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;


@RestController
@RequestMapping("/api/v1/credential-categories")
public class CredentialCategoryController {

    private final CredentialService credentialService;

    public CredentialCategoryController(CredentialService credentialService) {
        this.credentialService = credentialService;
    }

    @GetMapping
    public ResponseEntity<List<String>> list() {
        return ResponseEntity.ok(credentialService.listDistinctCategories());
    }
}
