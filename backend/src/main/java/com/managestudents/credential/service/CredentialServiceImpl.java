package com.managestudents.credential.service;

import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.credential.dto.CredentialCreateRequest;
import com.managestudents.credential.dto.CredentialResponse;
import com.managestudents.credential.dto.CredentialUpdateRequest;
import com.managestudents.credential.entity.Credential;
import com.managestudents.credential.repository.CredentialRepository;
import com.managestudents.credential.repository.CredentialSpecifications;
import com.managestudents.storage.CredentialDocumentStorageService;
import com.managestudents.user.entity.User;
import com.managestudents.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class CredentialServiceImpl implements CredentialService {

    private final CredentialRepository credentialRepository;
    private final UserRepository userRepository;
    private final CredentialDocumentStorageService credentialDocumentStorageService;

    public CredentialServiceImpl(
            CredentialRepository credentialRepository,
            UserRepository userRepository,
            CredentialDocumentStorageService credentialDocumentStorageService) {
        this.credentialRepository = credentialRepository;
        this.userRepository = userRepository;
        this.credentialDocumentStorageService = credentialDocumentStorageService;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CredentialResponse> findAll(UUID userId, String keyword, String category, Pageable pageable) {
        Specification<Credential> spec = CredentialSpecifications.filter(userId, keyword, category);
        return credentialRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> listDistinctCategories() {
        List<String> raw = credentialRepository.findDistinctCredentialCategories();
        List<String> cleaned = new ArrayList<>();
        if (raw != null) {
            for (String s : raw) {
                if (s != null && !s.isBlank()) {
                    cleaned.add(s.trim());
                }
            }
        }
        return List.copyOf(cleaned);
    }

    @Override
    @Transactional(readOnly = true)
    public CredentialResponse findById(Long id) {
        Credential e = credentialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chứng chỉ / bằng cấp"));
        return toResponse(e);
    }

    @Override
    @Transactional
    public CredentialResponse create(CredentialCreateRequest request) {
        UUID userId = request.getUserId();
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Không tìm thấy người dùng");
        }
        Credential e = new Credential();
        e.setUser(userRepository.getReferenceById(userId));
        applyBody(
                e,
                request.getCredentialName(),
                request.getCredentialCategory(),
                request.getIssuingOrganization(),
                request.getCredentialNumber(),
                request.getIssueDate(),
                request.getExpiryDate(),
                request.getNotes(),
                request.getAttachmentUrl());
        return toResponse(credentialRepository.save(e));
    }

    @Override
    @Transactional
    public CredentialResponse update(Long id, CredentialUpdateRequest request) {
        Credential e = credentialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chứng chỉ / bằng cấp"));
        UUID userId = request.getUserId();
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Không tìm thấy người dùng");
        }
        String previousAttachment = e.getAttachmentUrl();
        e.setUser(userRepository.getReferenceById(userId));
        applyBody(
                e,
                request.getCredentialName(),
                request.getCredentialCategory(),
                request.getIssuingOrganization(),
                request.getCredentialNumber(),
                request.getIssueDate(),
                request.getExpiryDate(),
                request.getNotes(),
                request.getAttachmentUrl());
        Credential saved = credentialRepository.save(e);
        credentialDocumentStorageService.deleteIfReplaced(previousAttachment, saved.getAttachmentUrl());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        Credential e = credentialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chứng chỉ / bằng cấp"));
        credentialDocumentStorageService.deleteIfManaged(e.getAttachmentUrl());
        credentialRepository.delete(e);
    }

    private static void applyBody(
            Credential e,
            String name,
            String category,
            String org,
            String number,
            java.time.LocalDate issue,
            java.time.LocalDate expiry,
            String notes,
            String attachmentUrl) {
        e.setCredentialName(name == null ? "" : name.trim());
        e.setCredentialCategory(category == null ? "" : category.trim());
        e.setIssuingOrganization(trimToNull(org));
        e.setCredentialNumber(trimToNull(number));
        e.setIssueDate(issue);
        e.setExpiryDate(expiry);
        e.setNotes(trimToNull(notes));
        e.setAttachmentUrl(trimToNull(attachmentUrl));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private CredentialResponse toResponse(Credential e) {
        User u = e.getUser();
        CredentialResponse dto = new CredentialResponse();
        dto.setId(e.getId());
        dto.setUserId(u.getId());
        dto.setUserFullName(u.getFullName());
        dto.setCredentialName(e.getCredentialName());
        dto.setCredentialCategory(e.getCredentialCategory());
        dto.setIssuingOrganization(e.getIssuingOrganization());
        dto.setCredentialNumber(e.getCredentialNumber());
        dto.setIssueDate(e.getIssueDate());
        dto.setExpiryDate(e.getExpiryDate());
        dto.setNotes(e.getNotes());
        dto.setAttachmentUrl(e.getAttachmentUrl());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }
}
