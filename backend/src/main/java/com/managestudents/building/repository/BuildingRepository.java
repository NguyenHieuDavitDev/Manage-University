package com.managestudents.building.repository;

import com.managestudents.building.entity.Building;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface BuildingRepository extends JpaRepository<Building, Long>, JpaSpecificationExecutor<Building> {

    boolean existsByBuildingCode(String buildingCode);

    boolean existsByBuildingCodeAndIdNot(String buildingCode, Long id);
}
