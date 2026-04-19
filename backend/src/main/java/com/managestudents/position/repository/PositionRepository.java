package com.managestudents.position.repository;

import com.managestudents.position.entity.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface PositionRepository extends JpaRepository<Position, Long>, JpaSpecificationExecutor<Position> {

    boolean existsByPositionCode(String positionCode);

    boolean existsByPositionCodeAndIdNot(String positionCode, Long id);

    @Query("select distinct p.positionCategory from Position p where p.positionCategory is not null order by p.positionCategory asc")
    List<String> findDistinctPositionCategories();
}
