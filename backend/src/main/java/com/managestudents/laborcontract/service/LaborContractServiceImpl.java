package com.managestudents.laborcontract.service;

import com.managestudents.common.exception.DuplicateResourceFieldException;
import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.laborcontract.dto.LaborContractCreateRequest;
import com.managestudents.laborcontract.dto.LaborContractResponse;
import com.managestudents.laborcontract.dto.LaborContractUpdateRequest;
import com.managestudents.laborcontract.entity.LaborContract;
import com.managestudents.laborcontract.repository.LaborContractRepository;
import com.managestudents.laborcontract.repository.LaborContractSpecifications;
import com.managestudents.storage.LaborContractDocumentStorageService;
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
public class LaborContractServiceImpl implements LaborContractService {

    private final LaborContractRepository laborContractRepository;
    private final UserRepository userRepository;
    private final LaborContractDocumentStorageService laborContractDocumentStorageService;

    public LaborContractServiceImpl(
            LaborContractRepository laborContractRepository,
            UserRepository userRepository,
            LaborContractDocumentStorageService laborContractDocumentStorageService) {
        this.laborContractRepository = laborContractRepository;
        this.userRepository = userRepository;
        this.laborContractDocumentStorageService = laborContractDocumentStorageService;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LaborContractResponse> findAll(
            UUID userId, String keyword, String contractType, Pageable pageable) {
        Specification<LaborContract> spec = LaborContractSpecifications.filter(userId, keyword, contractType);
        return laborContractRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> listDistinctContractTypes() {
        List<String> raw = laborContractRepository.findDistinctContractTypes();
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
    public LaborContractResponse findById(Long id) {
        LaborContract e = laborContractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng lao động"));
        return toResponse(e);
    }

    @Override
    @Transactional
    public LaborContractResponse create(LaborContractCreateRequest request) {
        UUID userId = request.getUserId();
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Không tìm thấy người dùng");
        }
        String num = normalize(request.getContractNumber());
        if (laborContractRepository.existsByUser_IdAndContractNumber(userId, num)) {
            throw new DuplicateResourceFieldException("contractNumber", "Số hợp đồng đã tồn tại cho người này");
        }
        LaborContract e = new LaborContract();
        e.setUser(userRepository.getReferenceById(userId));
        applyBody(
                e,
                num,
                request.getContractType(),
                request.getStartDate(),
                request.getEndDate(),
                request.getStatus(),
                request.getNotes(),
                request.getAttachmentUrl());
        return toResponse(laborContractRepository.save(e));
    }

    @Override
    @Transactional
    public LaborContractResponse update(Long id, LaborContractUpdateRequest request) {
        LaborContract e = laborContractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng lao động"));
        UUID userId = request.getUserId();
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Không tìm thấy người dùng");
        }
        String num = normalize(request.getContractNumber());
        if (laborContractRepository.existsByUser_IdAndContractNumberAndIdNot(userId, num, id)) {
            throw new DuplicateResourceFieldException("contractNumber", "Số hợp đồng đã tồn tại cho người này");
        }
        String previousAttachment = e.getAttachmentUrl();
        e.setUser(userRepository.getReferenceById(userId));
        applyBody(
                e,
                num,
                request.getContractType(),
                request.getStartDate(),
                request.getEndDate(),
                request.getStatus(),
                request.getNotes(),
                request.getAttachmentUrl());
        LaborContract saved = laborContractRepository.save(e);
        laborContractDocumentStorageService.deleteIfReplaced(previousAttachment, saved.getAttachmentUrl());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        LaborContract e = laborContractRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng lao động"));
        laborContractDocumentStorageService.deleteIfManaged(e.getAttachmentUrl());
        laborContractRepository.delete(e);
    }

    private static String normalize(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private static void applyBody(
            LaborContract e,
            String number,
            String type,
            java.time.LocalDate start,
            java.time.LocalDate end,
            String status,
            String notes,
            String attachmentUrl) {
        e.setContractNumber(number);
        e.setContractType(trimToNull(type));
        e.setStartDate(start);
        e.setEndDate(end);
        e.setStatus(trimToNull(status));
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

    private LaborContractResponse toResponse(LaborContract e) {
        User u = e.getUser();
        LaborContractResponse dto = new LaborContractResponse();
        dto.setId(e.getId());
        dto.setUserId(u.getId());
        dto.setUserFullName(u.getFullName());
        dto.setContractNumber(e.getContractNumber());
        dto.setContractType(e.getContractType());
        dto.setStartDate(e.getStartDate());
        dto.setEndDate(e.getEndDate());
        dto.setStatus(e.getStatus());
        dto.setNotes(e.getNotes());
        dto.setAttachmentUrl(e.getAttachmentUrl());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }
}
