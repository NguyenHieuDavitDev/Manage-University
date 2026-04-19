package com.managestudents.insurance.service;

import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.insurance.dto.InsuranceCreateRequest;
import com.managestudents.insurance.dto.InsuranceResponse;
import com.managestudents.insurance.dto.InsuranceUpdateRequest;
import com.managestudents.insurance.entity.Insurance;
import com.managestudents.insurance.repository.InsuranceRepository;
import com.managestudents.insurance.repository.InsuranceSpecifications;
import com.managestudents.storage.InsuranceDocumentStorageService;
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
public class InsuranceServiceImpl implements InsuranceService {

    private final InsuranceRepository insuranceRepository;
    private final UserRepository userRepository;
    private final InsuranceDocumentStorageService insuranceDocumentStorageService;

    public InsuranceServiceImpl(
            InsuranceRepository insuranceRepository,
            UserRepository userRepository,
            InsuranceDocumentStorageService insuranceDocumentStorageService) {
        this.insuranceRepository = insuranceRepository;
        this.userRepository = userRepository;
        this.insuranceDocumentStorageService = insuranceDocumentStorageService;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InsuranceResponse> findAll(UUID userId, String keyword, String insuranceType, Pageable pageable) {
        Specification<Insurance> spec = InsuranceSpecifications.filter(userId, keyword, insuranceType);
        return insuranceRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> listDistinctInsuranceTypes() {
        List<String> raw = insuranceRepository.findDistinctInsuranceTypes();
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
    public InsuranceResponse findById(Long id) {
        Insurance e = insuranceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bảo hiểm"));
        return toResponse(e);
    }

    @Override
    @Transactional
    public InsuranceResponse create(InsuranceCreateRequest request) {
        UUID userId = request.getUserId();
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Không tìm thấy người dùng");
        }
        Insurance e = new Insurance();
        e.setUser(userRepository.getReferenceById(userId));
        applyBody(
                e,
                request.getInsuranceType(),
                request.getPolicyNumber(),
                request.getProvider(),
                request.getStartDate(),
                request.getEndDate(),
                request.getNotes(),
                request.getAttachmentUrl());
        return toResponse(insuranceRepository.save(e));
    }

    @Override
    @Transactional
    public InsuranceResponse update(Long id, InsuranceUpdateRequest request) {
        Insurance e = insuranceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bảo hiểm"));
        UUID userId = request.getUserId();
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Không tìm thấy người dùng");
        }
        String previousAttachment = e.getAttachmentUrl();
        e.setUser(userRepository.getReferenceById(userId));
        applyBody(
                e,
                request.getInsuranceType(),
                request.getPolicyNumber(),
                request.getProvider(),
                request.getStartDate(),
                request.getEndDate(),
                request.getNotes(),
                request.getAttachmentUrl());
        Insurance saved = insuranceRepository.save(e);
        insuranceDocumentStorageService.deleteIfReplaced(previousAttachment, saved.getAttachmentUrl());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        Insurance e = insuranceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bảo hiểm"));
        insuranceDocumentStorageService.deleteIfManaged(e.getAttachmentUrl());
        insuranceRepository.delete(e);
    }

    private static void applyBody(
            Insurance e,
            String type,
            String policy,
            String provider,
            java.time.LocalDate start,
            java.time.LocalDate end,
            String notes,
            String attachmentUrl) {
        e.setInsuranceType(type == null ? "" : type.trim());
        e.setPolicyNumber(trimToNull(policy));
        e.setProvider(trimToNull(provider));
        e.setStartDate(start);
        e.setEndDate(end);
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

    private InsuranceResponse toResponse(Insurance e) {
        User u = e.getUser();
        InsuranceResponse dto = new InsuranceResponse();
        dto.setId(e.getId());
        dto.setUserId(u.getId());
        dto.setUserFullName(u.getFullName());
        dto.setInsuranceType(e.getInsuranceType());
        dto.setPolicyNumber(e.getPolicyNumber());
        dto.setProvider(e.getProvider());
        dto.setStartDate(e.getStartDate());
        dto.setEndDate(e.getEndDate());
        dto.setNotes(e.getNotes());
        dto.setAttachmentUrl(e.getAttachmentUrl());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }
}
