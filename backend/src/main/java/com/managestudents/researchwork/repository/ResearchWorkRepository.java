package com.managestudents.researchwork.repository;

import com.managestudents.researchwork.entity.ResearchWork;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ResearchWorkRepository
        extends JpaRepository<ResearchWork, Long>, JpaSpecificationExecutor<ResearchWork> {

    @Query("select distinct r.workType from ResearchWork r where r.workType is not null order by r.workType asc")
    List<String> findDistinctWorkTypes();
}
