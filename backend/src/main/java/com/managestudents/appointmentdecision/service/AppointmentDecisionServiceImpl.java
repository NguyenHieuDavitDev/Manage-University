package com.managestudents.appointmentdecision.service;

import com.managestudents.academicrank.entity.AcademicRank;
import com.managestudents.academicrank.repository.AcademicRankRepository;
import com.managestudents.appointmentdecision.dto.AppointmentDecisionCreateRequest;
import com.managestudents.appointmentdecision.dto.AppointmentDecisionResponse;
import com.managestudents.appointmentdecision.dto.AppointmentDecisionUpdateRequest;
import com.managestudents.appointmentdecision.entity.AppointmentDecision;
import com.managestudents.appointmentdecision.repository.AppointmentDecisionRepository;
import com.managestudents.appointmentdecision.repository.AppointmentDecisionSpecifications;
import com.managestudents.common.exception.DuplicateResourceFieldException;
import com.managestudents.common.exception.ResourceNotFoundException;
import com.managestudents.faculty.entity.Faculty;
import com.managestudents.faculty.repository.FacultyRepository;
import com.managestudents.position.entity.Position;
import com.managestudents.position.repository.PositionRepository;
import com.managestudents.user.entity.User;
import com.managestudents.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AppointmentDecisionServiceImpl implements AppointmentDecisionService {

    private final AppointmentDecisionRepository appointmentDecisionRepository;
    private final UserRepository userRepository;
    private final PositionRepository positionRepository;
    private final FacultyRepository facultyRepository;
    private final AcademicRankRepository academicRankRepository;

    public AppointmentDecisionServiceImpl(
            AppointmentDecisionRepository appointmentDecisionRepository,
            UserRepository userRepository,
            PositionRepository positionRepository,
            FacultyRepository facultyRepository,
            AcademicRankRepository academicRankRepository) {
        this.appointmentDecisionRepository = appointmentDecisionRepository;
        this.userRepository = userRepository;
        this.positionRepository = positionRepository;
        this.facultyRepository = facultyRepository;
        this.academicRankRepository = academicRankRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AppointmentDecisionResponse> findAll(UUID userId, String keyword, Pageable pageable) {
        Specification<AppointmentDecision> spec = AppointmentDecisionSpecifications.filter(userId, keyword);
        return appointmentDecisionRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AppointmentDecisionResponse findById(Long id) {
        AppointmentDecision e = appointmentDecisionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quyết định bổ nhiệm"));
        return toResponse(e);
    }

    @Override
    @Transactional
    public AppointmentDecisionResponse create(AppointmentDecisionCreateRequest request) {
        UUID userId = request.getUserId();
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Không tìm thấy người dùng");
        }
        String num = normalize(request.getDecisionNumber());
        if (appointmentDecisionRepository.existsByUser_IdAndDecisionNumber(userId, num)) {
            throw new DuplicateResourceFieldException("decisionNumber", "Số quyết định đã tồn tại cho người này");
        }
        AppointmentDecision e = new AppointmentDecision();
        e.setUser(userRepository.getReferenceById(userId));
        applyRefs(e, request.getPositionId(), request.getFacultyId(), request.getAcademicRankId());
        e.setDecisionNumber(num);
        e.setDecisionDate(request.getDecisionDate());
        e.setEffectiveDate(request.getEffectiveDate());
        e.setAppointedTitle(trimToNull(request.getAppointedTitle()));
        e.setNotes(trimToNull(request.getNotes()));
        return toResponse(appointmentDecisionRepository.save(e));
    }

    @Override
    @Transactional
    public AppointmentDecisionResponse update(Long id, AppointmentDecisionUpdateRequest request) {
        AppointmentDecision e = appointmentDecisionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quyết định bổ nhiệm"));
        UUID userId = request.getUserId();
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("Không tìm thấy người dùng");
        }
        String num = normalize(request.getDecisionNumber());
        if (appointmentDecisionRepository.existsByUser_IdAndDecisionNumberAndIdNot(userId, num, id)) {
            throw new DuplicateResourceFieldException("decisionNumber", "Số quyết định đã tồn tại cho người này");
        }
        e.setUser(userRepository.getReferenceById(userId));
        applyRefs(e, request.getPositionId(), request.getFacultyId(), request.getAcademicRankId());
        e.setDecisionNumber(num);
        e.setDecisionDate(request.getDecisionDate());
        e.setEffectiveDate(request.getEffectiveDate());
        e.setAppointedTitle(trimToNull(request.getAppointedTitle()));
        e.setNotes(trimToNull(request.getNotes()));
        return toResponse(appointmentDecisionRepository.save(e));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!appointmentDecisionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy quyết định bổ nhiệm");
        }
        appointmentDecisionRepository.deleteById(id);
    }

    private void applyRefs(AppointmentDecision e, Long positionId, Long facultyId, Long academicRankId) {
        e.setPosition(resolvePosition(positionId));
        e.setFaculty(resolveFaculty(facultyId));
        e.setAcademicRank(resolveRank(academicRankId));
    }

    private Position resolvePosition(Long id) {
        if (id == null) {
            return null;
        }
        return positionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chức vụ"));
    }

    private Faculty resolveFaculty(Long id) {
        if (id == null) {
            return null;
        }
        return facultyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy khoa"));
    }

    private AcademicRank resolveRank(Long id) {
        if (id == null) {
            return null;
        }
        return academicRankRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hàm học vị"));
    }

    private static String normalize(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private AppointmentDecisionResponse toResponse(AppointmentDecision e) {
        User u = e.getUser();
        AppointmentDecisionResponse dto = new AppointmentDecisionResponse();
        dto.setId(e.getId());
        dto.setUserId(u.getId());
        dto.setUserFullName(u.getFullName());
        dto.setDecisionNumber(e.getDecisionNumber());
        dto.setDecisionDate(e.getDecisionDate());
        dto.setEffectiveDate(e.getEffectiveDate());
        if (e.getPosition() != null) {
            dto.setPositionId(e.getPosition().getId());
            dto.setPositionName(e.getPosition().getPositionName());
        }
        if (e.getFaculty() != null) {
            dto.setFacultyId(e.getFaculty().getId());
            dto.setFacultyName(e.getFaculty().getFacultyName());
        }
        if (e.getAcademicRank() != null) {
            dto.setAcademicRankId(e.getAcademicRank().getId());
            dto.setAcademicRankName(e.getAcademicRank().getRankName());
        }
        dto.setAppointedTitle(e.getAppointedTitle());
        dto.setNotes(e.getNotes());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        return dto;
    }
}
