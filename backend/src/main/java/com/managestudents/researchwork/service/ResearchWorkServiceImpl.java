package com.managestudents.researchwork.service;

import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.researchwork.dto.ResearchWorkCreateRequest;
import com.managestudents.researchwork.dto.ResearchWorkResponse;
import com.managestudents.researchwork.dto.ResearchWorkUpdateRequest;
import com.managestudents.researchwork.entity.ResearchWork;
import com.managestudents.researchwork.repository.ResearchWorkRepository;
import com.managestudents.researchwork.repository.ResearchWorkSpecifications;
import com.managestudents.storage.ResearchWorkDocumentStorageService;
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
public class ResearchWorkServiceImpl implements ResearchWorkService {

    private final ResearchWorkRepository researchWorkRepository;
    private final UserRepository userRepository;
    private final ResearchWorkDocumentStorageService researchWorkDocumentStorageService;

    public ResearchWorkServiceImpl(
            ResearchWorkRepository researchWorkRepository,
            UserRepository userRepository,
            ResearchWorkDocumentStorageService researchWorkDocumentStorageService) {
        this.researchWorkRepository = researchWorkRepository;
        this.userRepository = userRepository;
        this.researchWorkDocumentStorageService = researchWorkDocumentStorageService;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ResearchWorkResponse> findAll(UUID userId, String keyword, String workType, Pageable pageable) {
        Specification<ResearchWork> spec = ResearchWorkSpecifications.filter(userId, keyword, workType);
        return researchWorkRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> listDistinctWorkTypes() {
        List<String> raw = researchWorkRepository.findDistinctWorkTypes();
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
    public ResearchWorkResponse findById(Long id) {
        ResearchWork e = researchWorkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công trình nghiên cứu"));
        return toResponse(e);
    }

    @Override
    @Transactional
    public ResearchWorkResponse create(ResearchWorkCreateRequest request) {
        UUID userId = request.getUserId();
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Không tìm thấy người dùng");
        }
        ResearchWork e = new ResearchWork();
        e.setUser(userRepository.getReferenceById(userId));
        applyBody(
                e,
                request.getTitle(),
                request.getWorkType(),
                request.getPublicationYear(),
                request.getVenue(),
                request.getAuthorRole(),
                request.getNotes(),
                request.getAttachmentUrl());
        return toResponse(researchWorkRepository.save(e));
    }

    @Override
    @Transactional
    public ResearchWorkResponse update(Long id, ResearchWorkUpdateRequest request) {
        ResearchWork e = researchWorkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công trình nghiên cứu"));
        UUID userId = request.getUserId();
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Không tìm thấy người dùng");
        }
        String previousAttachment = e.getAttachmentUrl();
        e.setUser(userRepository.getReferenceById(userId));
        applyBody(
                e,
                request.getTitle(),
                request.getWorkType(),
                request.getPublicationYear(),
                request.getVenue(),
                request.getAuthorRole(),
                request.getNotes(),
                request.getAttachmentUrl());
        ResearchWork saved = researchWorkRepository.save(e);
        researchWorkDocumentStorageService.deleteIfReplaced(previousAttachment, saved.getAttachmentUrl());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        ResearchWork e = researchWorkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy công trình nghiên cứu"));
        researchWorkDocumentStorageService.deleteIfManaged(e.getAttachmentUrl());
        researchWorkRepository.delete(e);
    }

    private static void applyBody(
            ResearchWork e,
            String title,
            String workType,
            Integer year,
            String venue,
            String authorRole,
            String notes,
            String attachmentUrl) {
        e.setTitle(title == null ? "" : title.trim());
        e.setWorkType(trimToNull(workType));
        e.setPublicationYear(year);
        e.setVenue(trimToNull(venue));
        e.setAuthorRole(trimToNull(authorRole));
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

    private ResearchWorkResponse toResponse(ResearchWork e) {
        User u = e.getUser();
        ResearchWorkResponse dto = new ResearchWorkResponse();
        dto.setId(e.getId());
        dto.setUserId(u.getId());
        dto.setUserFullName(u.getFullName());
        dto.setTitle(e.getTitle());
        dto.setWorkType(e.getWorkType());
        dto.setPublicationYear(e.getPublicationYear());
        dto.setVenue(e.getVenue());
        dto.setAuthorRole(e.getAuthorRole());
        dto.setNotes(e.getNotes());
        dto.setAttachmentUrl(e.getAttachmentUrl());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }
}
