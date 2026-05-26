package com.hrservice.hr.repository;

import com.hrservice.hr.entity.DeductionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeductionTypeRepository extends JpaRepository<DeductionType, Long> {

    Optional<DeductionType> findByName(String name);

    List<DeductionType> findByCategory(String category);

    List<DeductionType> findByIsActiveTrueOrderByName();

    List<DeductionType> findByIsMandatoryTrueAndIsActiveTrueOrderByName();
}
