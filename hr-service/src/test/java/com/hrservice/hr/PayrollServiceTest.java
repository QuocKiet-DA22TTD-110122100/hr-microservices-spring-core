package com.hrservice.hr;

import com.hrservice.hr.config.PayrollService;
import com.hrservice.hr.entity.*;
import com.hrservice.hr.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

@DataJpaTest
@Import(PayrollService.class)
@org.springframework.test.context.TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=false",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect",
    "spring.sql.init.mode=never"
})
public class PayrollServiceTest {

    @Autowired
    private PayrollResultRepository payrollResultRepository;

    @Autowired
    private PayrollHistoryRepository payrollHistoryRepository;

    @Autowired
    private TaxConfigRepository taxConfigRepository;

    @Autowired
    private DeductionTypeRepository deductionTypeRepository;

    @Autowired
    private DeductionInstanceRepository deductionInstanceRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private PayrollService payrollService;

    @MockitoBean
    private com.hrservice.hr.service.PayrollWorkflowEventPublisher payrollWorkflowEventPublisher;

    private Employee testEmployee;
    private Department testDepartment;

    @BeforeEach
    public void setUp() {
        // Spring/Hibernate will create schema automatically for the in-memory H2 database
        // Create test department
        testDepartment = new Department();
        testDepartment.setName("HR");
        departmentRepository.save(testDepartment);

        // Create test employee
        testEmployee = new Employee();
        testEmployee.setAuthUserId("auth-123");
        testEmployee.setUsername("john.doe");
        testEmployee.setName("John Doe");
        testEmployee.setPosition("Senior Developer");
        testEmployee.setBaseSalary(new BigDecimal("120000.00"));
        testEmployee.setCurrency("USD");
        testEmployee.setJobLevel("senior");
        testEmployee.setHireDate(LocalDate.of(2020, 1, 15));
        testEmployee.setDepartment(testDepartment);
        employeeRepository.save(testEmployee);

        // Create tax config bracket 1
        TaxConfig taxConfig = new TaxConfig();
        taxConfig.setYear(2026);
        taxConfig.setCountry("USD");
        taxConfig.setMinBracket(new BigDecimal("0"));
        taxConfig.setMaxBracket(new BigDecimal("50000"));
        taxConfig.setTaxRate(new BigDecimal("10.00"));
        taxConfig.setIsActive(true);
        taxConfigRepository.save(taxConfig);

        // Create tax config bracket 2
        TaxConfig taxConfig2 = new TaxConfig();
        taxConfig2.setYear(2026);
        taxConfig2.setCountry("USD");
        taxConfig2.setMinBracket(new BigDecimal("50000"));
        taxConfig2.setMaxBracket(null);
        taxConfig2.setTaxRate(new BigDecimal("15.00"));
        taxConfig2.setIsActive(true);
        taxConfigRepository.save(taxConfig2);
    }

    @Test
    public void testCalculatePayrollBasic() throws Exception {
        YearMonth yearMonth = YearMonth.of(2026, 5);

        PayrollResult result = payrollService.calculatePayroll(testEmployee.getId(), yearMonth);

        assertNotNull(result);
        assertEquals(testEmployee.getId(), result.getEmployee().getId());
        
        BigDecimal expectedGross = new BigDecimal("10000.00"); // 120000 / 12
        assertEquals(0, result.getGrossPay().compareTo(expectedGross));
        
        assertTrue(result.getTaxDeduction().compareTo(BigDecimal.ZERO) > 0);
        assertEquals("DRAFT", result.getStatus());
    }

    @Test
    public void testCalculatePayrollNoSalary() {
        Employee noSalaryEmployee = new Employee();
        noSalaryEmployee.setAuthUserId("auth-456");
        noSalaryEmployee.setUsername("jane.smith");
        noSalaryEmployee.setName("Jane Smith");
        employeeRepository.save(noSalaryEmployee);

        YearMonth yearMonth = YearMonth.of(2026, 5);

        assertThrows(IllegalArgumentException.class, () ->
            payrollService.calculatePayroll(noSalaryEmployee.getId(), yearMonth)
        );
    }

    @Test
    public void testApprovePayroll() throws Exception {
        YearMonth yearMonth = YearMonth.of(2026, 5);
        PayrollResult result = payrollService.calculatePayroll(testEmployee.getId(), yearMonth);

        PayrollResult approved = payrollService.approvePayroll(result.getId(), "HR_ADMIN");

        assertEquals("APPROVED", approved.getStatus());
        assertNotNull(approved.getUpdatedAt());
        assertEquals("HR_ADMIN", approved.getApprovedBy());
        assertNotNull(approved.getApprovedAt());
        verify(payrollWorkflowEventPublisher).publishApproved(any());

        List<PayrollHistory> history = payrollHistoryRepository.findByPayrollResultIdOrderByCreatedAtDesc(result.getId());
        assertTrue(history.stream().anyMatch(entry -> "APPROVED".equals(entry.getEventType())));
    }

    @Test
    public void testRejectPayrollReturnsApprovedPayrollToDraft() throws Exception {
        YearMonth yearMonth = YearMonth.of(2026, 5);
        PayrollResult result = payrollService.calculatePayroll(testEmployee.getId(), yearMonth);
        PayrollResult approved = payrollService.approvePayroll(result.getId(), "HR_ADMIN");
        clearInvocations(payrollWorkflowEventPublisher);

        PayrollResult rejected = payrollService.rejectPayroll(approved.getId(), "Incorrect bonus input", "payroll@example.com");

        assertEquals("DRAFT", rejected.getStatus());
        assertNull(rejected.getApprovedBy());
        assertNull(rejected.getApprovedAt());
        assertNull(rejected.getProcessedBy());
        assertNull(rejected.getProcessedAt());
        assertEquals("Incorrect bonus input", rejected.getRemarks());

        List<PayrollHistory> history = payrollHistoryRepository.findByPayrollResultIdOrderByCreatedAtDesc(result.getId());
        assertTrue(history.stream().anyMatch(entry -> "REJECTED".equals(entry.getEventType())));
        verifyNoInteractions(payrollWorkflowEventPublisher);
    }

    @Test
    public void testProcessPayrollFinalizesApprovedPayroll() throws Exception {
        YearMonth yearMonth = YearMonth.of(2026, 5);
        PayrollResult result = payrollService.calculatePayroll(testEmployee.getId(), yearMonth);
        PayrollResult approved = payrollService.approvePayroll(result.getId(), "HR_ADMIN");
        clearInvocations(payrollWorkflowEventPublisher);

        PayrollResult processed = payrollService.processPayroll(approved.getId(), "payroll@example.com");

        assertEquals("PROCESSED", processed.getStatus());
        assertEquals("payroll@example.com", processed.getProcessedBy());
        assertNotNull(processed.getProcessedAt());
        verify(payrollWorkflowEventPublisher).publishProcessed(any());

        List<PayrollHistory> history = payrollHistoryRepository.findByPayrollResultIdOrderByCreatedAtDesc(result.getId());
        assertTrue(history.stream().anyMatch(entry -> "PROCESSED".equals(entry.getEventType())));
    }

    @Test
    public void testProcessPayrollRequiresApprovedStatus() throws Exception {
        YearMonth yearMonth = YearMonth.of(2026, 5);
        PayrollResult result = payrollService.calculatePayroll(testEmployee.getId(), yearMonth);

        IllegalStateException exception = assertThrows(IllegalStateException.class, () ->
            payrollService.processPayroll(result.getId(), "payroll@example.com")
        );

        assertTrue(exception.getMessage().contains("APPROVED"));
        verifyNoInteractions(payrollWorkflowEventPublisher);
    }

    @Test
    public void testValidatePayrollComplianceInvalidNetPay() throws Exception {
        PayrollResult payroll = new PayrollResult();
        payroll.setEmployee(testEmployee);
        payroll.setGrossPay(new BigDecimal("5000.00"));
        payroll.setTaxDeduction(new BigDecimal("1000.00"));
        payroll.setInsuranceDeduction(BigDecimal.ZERO);
        payroll.setOtherDeduction(BigDecimal.ZERO);
        payroll.setTotalDeduction(new BigDecimal("1000.00"));
        payroll.setNetPay(new BigDecimal("6000.00")); // Exceeds gross

        assertThrows(IllegalArgumentException.class, () ->
            payrollService.validatePayrollCompliance(payroll)
        );
    }

    @Test
    public void testValidatePayrollComplianceNegativeTax() throws Exception {
        PayrollResult payroll = new PayrollResult();
        payroll.setEmployee(testEmployee);
        payroll.setGrossPay(new BigDecimal("5000.00"));
        payroll.setTaxDeduction(new BigDecimal("-100.00")); // Negative tax
        payroll.setInsuranceDeduction(BigDecimal.ZERO);
        payroll.setOtherDeduction(BigDecimal.ZERO);
        payroll.setTotalDeduction(new BigDecimal("-100.00"));
        payroll.setNetPay(new BigDecimal("5100.00"));

        assertThrows(IllegalArgumentException.class, () ->
            payrollService.validatePayrollCompliance(payroll)
        );
    }

    @Test
    public void testCalculatePayrollWithDeductions() throws Exception {
        // Create deduction type
        DeductionType healthInsurance = new DeductionType();
        healthInsurance.setName("Health Insurance");
        healthInsurance.setCategory("INSURANCE");
        healthInsurance.setIsPercentage(true);
        healthInsurance.setDefaultRate(new BigDecimal("5.00"));
        healthInsurance.setIsMandatory(true);
        healthInsurance.setIsActive(true);
        deductionTypeRepository.save(healthInsurance);

        // Assign deduction to employee
        DeductionInstance instance = new DeductionInstance();
        instance.setEmployee(testEmployee);
        instance.setDeductionType(healthInsurance);
        instance.setRate(new BigDecimal("5.00"));
        instance.setIsActive(true);
        instance.setStartDate(LocalDate.of(2026, 1, 1));
        instance.setEndDate(LocalDate.of(2026, 12, 31));
        deductionInstanceRepository.save(instance);

        YearMonth yearMonth = YearMonth.of(2026, 5);
        PayrollResult result = payrollService.calculatePayroll(testEmployee.getId(), yearMonth);

        assertNotNull(result);
        assertTrue(result.getInsuranceDeduction().compareTo(BigDecimal.ZERO) > 0);
        // Insurance should be ~5% of 10000 = 500
        BigDecimal expectedInsurance = new BigDecimal("500.00");
        assertEquals(0, result.getInsuranceDeduction().compareTo(expectedInsurance));
    }

    @Test
    public void testGetLatestPayroll() throws Exception {
        YearMonth yearMonth = YearMonth.of(2026, 5);
        payrollService.calculatePayroll(testEmployee.getId(), yearMonth);

        PayrollResult latest = payrollService.getLatestPayroll(testEmployee.getId())
                .orElse(null);

        assertNotNull(latest);
        assertEquals(testEmployee.getId(), latest.getEmployee().getId());
    }
}
