package com.hrservice.hr.repository;

import com.hrservice.hr.entity.PayrollHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PayrollHistoryRepository extends JpaRepository<PayrollHistory, Long> {

    List<PayrollHistory> findByEmployeeIdOrderByCreatedAtDesc(Long employeeId);

    List<PayrollHistory> findByPayrollResultIdOrderByCreatedAtDesc(Long payrollResultId);

    List<PayrollHistory> findByEventTypeOrderByCreatedAtDesc(String eventType);

    List<PayrollHistory> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime startTime, LocalDateTime endTime);
}
