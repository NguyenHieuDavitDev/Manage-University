package com.managestudents.classroom.service;

import com.managestudents.building.entity.Building;
import com.managestudents.building.repository.BuildingRepository;
import com.managestudents.classroom.dto.ClassroomCreateRequest;
import com.managestudents.classroom.dto.ClassroomResponse;
import com.managestudents.classroom.dto.ClassroomUpdateRequest;
import com.managestudents.classroom.entity.Classroom;
import com.managestudents.classroom.repository.ClassroomRepository;
import com.managestudents.classroom.repository.ClassroomSpecifications;
import com.managestudents.common.exception.DuplicateResourceFieldException;
import com.managestudents.common.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClassroomServiceImpl implements ClassroomService {

    private final ClassroomRepository classroomRepository;
    private final BuildingRepository buildingRepository;

    public ClassroomServiceImpl(ClassroomRepository classroomRepository, BuildingRepository buildingRepository) {
        this.classroomRepository = classroomRepository;
        this.buildingRepository = buildingRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ClassroomResponse> findAll(String keyword, Long buildingId, Pageable pageable) {
        Specification<Classroom> spec = ClassroomSpecifications.hasBuildingId(buildingId);
        if (keyword != null && !keyword.isBlank()) {
            spec = spec.and(ClassroomSpecifications.matchesKeyword(keyword));
        }
        return classroomRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public String nextRoomCode(int floorNumber) {
        return generateNextRoomCode(floorNumber);
    }

    @Override
    @Transactional(readOnly = true)
    public ClassroomResponse findById(Long id) {
        Classroom entity = classroomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng học"));
        return toResponse(entity);
    }

    @Override
    @Transactional
    public ClassroomResponse create(ClassroomCreateRequest request) {
        Integer floorNumber = request.getFloorNumber();
        if (floorNumber == null) {
            throw new ResourceNotFoundException("Thiếu thông tin tầng cho phòng học");
        }
        String code = generateNextRoomCode(floorNumber);
        Building building = findBuilding(request.getBuildingId());
        Classroom c = new Classroom();
        apply(c, code, request.getRoomName(), building, floorNumber, request.getCapacity(), request.getDescription());
        return toResponse(classroomRepository.save(c));
    }

    @Override
    @Transactional
    public ClassroomResponse update(Long id, ClassroomUpdateRequest request) {
        Classroom c = classroomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng học"));
        String code = normalize(request.getRoomCode());
        if (classroomRepository.existsByRoomCodeAndIdNot(code, id)) {
            throw new DuplicateResourceFieldException("roomCode", "Mã phòng học đã tồn tại");
        }
        Building building = findBuilding(request.getBuildingId());
        apply(c, code, request.getRoomName(), building, request.getFloorNumber(), request.getCapacity(), request.getDescription());
        return toResponse(classroomRepository.save(c));
    }

    @Override
    @Transactional
    public void deleteById(Long id) {
        if (!classroomRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy phòng học");
        }
        classroomRepository.deleteById(id);
    }

    private Building findBuilding(Long buildingId) {
        return buildingRepository.findById(buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tòa nhà"));
    }

    private static String normalize(String raw) {
        return raw == null ? "" : raw.trim();
    }

    private String generateNextRoomCode(int floorNumber) {
        int sequence = 1;
        while (true) {
            String candidate = "P" + (floorNumber * 100 + sequence);
            if (!classroomRepository.existsByRoomCode(candidate)) {
                return candidate;
            }
            sequence++;
        }
    }

    private static void apply(
            Classroom c,
            String roomCode,
            String roomName,
            Building building,
            Integer floorNumber,
            Integer capacity,
            String description) {
        c.setRoomCode(roomCode);
        c.setRoomName(roomName == null ? "" : roomName.trim());
        c.setBuilding(building);
        c.setFloorNumber(floorNumber);
        c.setCapacity(capacity);
        c.setDescription(trimToNull(description));
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }

    private ClassroomResponse toResponse(Classroom c) {
        ClassroomResponse dto = new ClassroomResponse();
        dto.setId(c.getId());
        dto.setRoomCode(c.getRoomCode());
        dto.setRoomName(c.getRoomName());
        dto.setBuildingId(c.getBuilding().getId());
        dto.setBuildingCode(c.getBuilding().getBuildingCode());
        dto.setBuildingName(c.getBuilding().getBuildingName());
        dto.setFloorNumber(c.getFloorNumber());
        dto.setCapacity(c.getCapacity());
        dto.setDescription(c.getDescription());
        dto.setCreatedAt(c.getCreatedAt());
        dto.setUpdatedAt(c.getUpdatedAt());
        return dto;
    }
}
