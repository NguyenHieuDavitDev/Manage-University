package com.managestudents.credential.service;

import com.managestudents.credential.dto.CredentialCreateRequest;
import com.managestudents.credential.dto.CredentialResponse;
import com.managestudents.credential.dto.CredentialUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface CredentialService {

    Page<CredentialResponse> findAll(UUID userId, String keyword, String category, Pageable pageable);

    List<String> listDistinctCategories();

    CredentialResponse findById(Long id);

    CredentialResponse create(CredentialCreateRequest request);

    CredentialResponse update(Long id, CredentialUpdateRequest request);

    void deleteById(Long id);
}
