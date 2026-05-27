package com.hrservice.hr.repository;

import com.hrservice.hr.entity.PayrollRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface PayrollRunRepository extends JpaRepository<PayrollRun, Long> {
    Optional<PayrollRun> findByPeriodStartDateAndPeriodEndDate(LocalDate periodStartDate, LocalDate periodEndDate);
}