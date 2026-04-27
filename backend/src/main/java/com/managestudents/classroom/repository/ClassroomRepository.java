package com.managestudents.classroom.repository;

import com.managestudents.classroom.entity.Classroom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface ClassroomRepository extends JpaRepository<Classroom, Long>, JpaSpecificationExecutor<Classroom> {

    boolean existsByRoomCode(String roomCode);

    boolean existsByRoomCodeAndIdNot(String roomCode, Long id);
}
