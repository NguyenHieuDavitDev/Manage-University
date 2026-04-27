package com.managestudents.classschedule.repository;

import com.managestudents.classschedule.entity.ClassSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface ClassScheduleRepository extends JpaRepository<ClassSchedule, Long>, JpaSpecificationExecutor<ClassSchedule> {
    List<ClassSchedule> findByDayOfWeek(Integer dayOfWeek);
    List<ClassSchedule> findByDayOfWeekAndIdNot(Integer dayOfWeek, Long id);
}
