package com.managestudents.workhistory.repository;

import com.managestudents.workhistory.entity.WorkHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface WorkHistoryRepository
        extends JpaRepository<WorkHistory, Long>, JpaSpecificationExecutor<WorkHistory> {
}
