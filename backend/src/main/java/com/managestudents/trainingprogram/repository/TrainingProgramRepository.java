package com.managestudents.trainingprogram.repository;

import com.managestudents.trainingprogram.entity.TrainingProgram;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface TrainingProgramRepository extends JpaRepository<TrainingProgram, Long>, JpaSpecificationExecutor<TrainingProgram> {

    boolean existsByProgramCode(String programCode);

    boolean existsByProgramCodeAndIdNot(String programCode, Long id);

    Optional<TrainingProgram> findByProgramCodeIgnoreCase(String programCode);
}
