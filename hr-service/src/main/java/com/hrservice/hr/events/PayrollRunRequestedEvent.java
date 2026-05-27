package com.hrservice.hr.events;

import java.io.Serializable;
import java.util.Map;

public class PayrollRunRequestedEvent implements Serializable {
    private String id;
    private int year;
    private int month;
    private Map<String, Object> metadata;

    public PayrollRunRequestedEvent() {}

    public PayrollRunRequestedEvent(String id, int year, int month, Map<String, Object> metadata) {
        this.id = id;
        this.year = year;
        this.month = month;
        this.metadata = metadata;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public int getMonth() { return month; }
    public void setMonth(int month) { this.month = month; }

    public Map<String, Object> getMetadata() { return metadata; }
    public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
}
// PR: included in feature/PAYROLL-001-payroll-run
