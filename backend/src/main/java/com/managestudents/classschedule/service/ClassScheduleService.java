package com.managestudents.classschedule.service;

import com.managestudents.classschedule.dto.ClassScheduleCreateRequest;
import com.managestudents.classschedule.dto.ClassScheduleMoveRequest;
import com.managestudents.classschedule.dto.ClassScheduleResponse;
import com.managestudents.classschedule.dto.ClassScheduleUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ClassScheduleService {
    Page<ClassScheduleResponse> findAll(String keyword, Long courseClassId, Long classroomId, Pageable pageable);

    ClassScheduleResponse findById(Long id);

    ClassScheduleResponse create(ClassScheduleCreateRequest request);

    ClassScheduleResponse update(Long id, ClassScheduleUpdateRequest request);

    ClassScheduleResponse move(Long id, ClassScheduleMoveRequest request);

    void deleteById(Long id);
}
