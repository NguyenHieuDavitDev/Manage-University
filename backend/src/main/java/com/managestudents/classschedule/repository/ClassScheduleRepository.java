package com.managestudents.classschedule.repository;

import com.managestudents.classschedule.entity.ClassSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ClassScheduleRepository extends JpaRepository<ClassSchedule, Long>, JpaSpecificationExecutor<ClassSchedule> {
    List<ClassSchedule> findByDayOfWeek(Integer dayOfWeek);
    List<ClassSchedule> findByDayOfWeekAndIdNot(Integer dayOfWeek, Long id);

    boolean existsByCourseClass_IdAndDayOfWeekAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long courseClassId, Integer dayOfWeek, LocalDate sessionDate, LocalDate sessionDateEnd);

    boolean existsByCourseClass_IdAndLecturerUser_IdAndDayOfWeekAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            Long courseClassId, UUID lecturerUserId, Integer dayOfWeek, LocalDate sessionDate, LocalDate sessionDateEnd);

    @Query("select distinct cs.courseClass.id from ClassSchedule cs where cs.lecturerUser.id = :uid")
    List<Long> findDistinctCourseClassIdsByLecturerUserId(@Param("uid") UUID uid);

    boolean existsByCourseClass_IdAndLecturerUser_Id(Long courseClassId, UUID lecturerUserId);

    @Query(
            """
                    select cs from ClassSchedule cs
                    join fetch cs.classroom
                    join fetch cs.courseClass cc
                    left join fetch cc.course
                    join fetch cs.lecturerUser
                    where cc.id = :ccId
                    order by cs.dayOfWeek asc, cs.startPeriod asc, cs.id asc
                    """)
    List<ClassSchedule> findWithDetailsByCourseClassId(@Param("ccId") Long courseClassId);

    @Query(
            """
                    select cs from ClassSchedule cs
                    join fetch cs.classroom
                    join fetch cs.courseClass cc
                    left join fetch cc.course
                    join fetch cs.lecturerUser
                    where cc.id = :ccId and cs.lecturerUser.id = :uid
                    order by cs.dayOfWeek asc, cs.startPeriod asc, cs.id asc
                    """)
    List<ClassSchedule> findWithDetailsByCourseClassIdAndLecturerUserId(
            @Param("ccId") Long courseClassId, @Param("uid") UUID lecturerUserId);
}
