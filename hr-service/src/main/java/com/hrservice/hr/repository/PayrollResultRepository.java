package com.hrservice.hr.repository;

import com.hrservice.hr.entity.PayrollResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollResultRepository extends JpaRepository<PayrollResult, Long> {

    List<PayrollResult> findByEmployeeId(Long employeeId);

    Optional<PayrollResult> findByEmployeeIdAndPeriodStartDateAndPeriodEndDate(
            Long employeeId, LocalDate periodStartDate, LocalDate periodEndDate);

    List<PayrollResult> findByEmployeeIdAndStatusOrderByPeriodStartDateDesc(
            Long employeeId, String status);

    @Query("SELECT pr FROM PayrollResult pr WHERE pr.employee.id = :employeeId " +
           "ORDER BY pr.periodStartDate DESC LIMIT 1")
    Optional<PayrollResult> findLatestByEmployeeId(@Param("employeeId") Long employeeId);

    List<PayrollResult> findByStatusOrderByCreatedAtDesc(String status);

    List<PayrollResult> findByPeriodStartDateBetween(LocalDate startDate, LocalDate endDate);
}
