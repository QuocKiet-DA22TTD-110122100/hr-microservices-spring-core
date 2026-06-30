package com.hrservice.hr.service;

import com.hrservice.hr.entity.PayrollRun;
import com.hrservice.hr.events.PayrollRunRequestedEvent;
import com.hrservice.hr.repository.PayrollRunRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.Map;

@Service
@Transactional
public class PayrollRunService {

    private final PayrollRunRepository payrollRunRepository;
    private final PayrollEventPublisher payrollEventPublisher;

    public PayrollRunService(PayrollRunRepository payrollRunRepository,
                             PayrollEventPublisher payrollEventPublisher) {
        this.payrollRunRepository = payrollRunRepository;
        this.payrollEventPublisher = payrollEventPublisher;
    }

    public PayrollRun createPayrollRun(YearMonth yearMonth, String requestedBy, String sourceSystem) {
        if (yearMonth == null) {
            throw new IllegalArgumentException("yearMonth is required");
        }

        LocalDate periodStart = yearMonth.atDay(1);
        LocalDate periodEnd = yearMonth.atEndOfMonth();

        payrollRunRepository.findByPeriodStartDateAndPeriodEndDate(periodStart, periodEnd)
            .ifPresent(existing -> {
                throw new IllegalStateException("Payroll run already exists for period " + yearMonth);
            });

        PayrollRun payrollRun = new PayrollRun();
        payrollRun.setPeriodStartDate(periodStart);
        payrollRun.setPeriodEndDate(periodEnd);
        payrollRun.setRequestedBy(requestedBy == null || requestedBy.isBlank() ? "SYSTEM" : requestedBy.trim());
        payrollRun.setSourceSystem(sourceSystem == null || sourceSystem.isBlank() ? "api" : sourceSystem.trim());

        PayrollRun saved = payrollRunRepository.save(payrollRun);

        Map<String, Object> metadata = new HashMap<>();
        metadata.put("requestedBy", saved.getRequestedBy());
        metadata.put("source", saved.getSourceSystem());

        payrollEventPublisher.publish(new PayrollRunRequestedEvent(
            saved.getId(),
            saved.getPeriodStartDate(),
            saved.getPeriodEndDate(),
            metadata
        ));

        return saved;
    }
}