package com.managestudents.attendance.repository;

import com.managestudents.attendance.entity.ClassAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClassAttendanceRepository extends JpaRepository<ClassAttendance, Long> {

    @Query(
            """
                    select a from ClassAttendance a
                    join fetch a.enrollment e
                    join fetch e.user
                    where e.courseClass.id = :ccId
                      and a.sessionDate = :sessionDate
                      and a.classSchedule.id = :scheduleId
                    """)
    List<ClassAttendance> findForSessionWithEnrollment(
            @Param("ccId") Long courseClassId,
            @Param("sessionDate") LocalDate sessionDate,
            @Param("scheduleId") Long classScheduleId);

    Optional<ClassAttendance> findByEnrollment_IdAndSessionDateAndClassSchedule_Id(
            Long enrollmentId, LocalDate sessionDate, Long classScheduleId);

    @Query(
            """
                    select a from ClassAttendance a
                    join fetch a.classSchedule cs
                    join fetch cs.classroom
                    join fetch cs.lecturerUser
                    join fetch a.enrollment e
                    where e.user.id = :userId and e.courseClass.id = :ccId
                      and a.sessionDate between :from and :to
                    order by a.sessionDate desc, cs.startPeriod desc, cs.id desc
                    """)
    List<ClassAttendance> findForStudentClassBetween(
            @Param("userId") UUID userId,
            @Param("ccId") Long courseClassId,
            @Param("from") LocalDate fromInclusive,
            @Param("to") LocalDate toInclusive);
}
