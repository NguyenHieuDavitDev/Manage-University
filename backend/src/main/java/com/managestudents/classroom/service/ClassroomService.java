package com.managestudents.classroom.service;

import com.managestudents.classroom.dto.ClassroomCreateRequest;
import com.managestudents.classroom.dto.ClassroomResponse;
import com.managestudents.classroom.dto.ClassroomUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ClassroomService {

    Page<ClassroomResponse> findAll(String keyword, Long buildingId, Pageable pageable);

    String nextRoomCode(int floorNumber);

    ClassroomResponse findById(Long id);

    ClassroomResponse create(ClassroomCreateRequest request);

    ClassroomResponse update(Long id, ClassroomUpdateRequest request);

    void deleteById(Long id);
}
