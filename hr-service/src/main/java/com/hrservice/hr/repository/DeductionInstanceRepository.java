package com.hrservice.hr.repository;

import com.hrservice.hr.entity.DeductionInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DeductionInstanceRepository extends JpaRepository<DeductionInstance, Long> {

    List<DeductionInstance> findByEmployeeId(Long employeeId);

    List<DeductionInstance> findByEmployeeIdAndIsActiveTrue(Long employeeId);

    List<DeductionInstance> findByDeductionTypeId(Long deductionTypeId);

    List<DeductionInstance> findByEmployeeIdAndIsActiveTrueAndStartDateLessThanEqualAndEndDateGreaterThanEqualOrderByDeductionTypeNameAsc(
            Long employeeId, LocalDate startDate, LocalDate endDate);
}
