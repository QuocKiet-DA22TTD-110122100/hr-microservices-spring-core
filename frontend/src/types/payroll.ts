import { Employee } from '@/types/employee';

export type PayrollStatus = 'DRAFT' | 'APPROVED' | 'PROCESSED' | 'FAILED' | string;

export interface PayrollResult {
  id: number;
  employee?: Employee | null;
  periodStartDate: string;
  periodEndDate: string;
  grossPay: number;
  taxDeduction?: number | null;
  insuranceDeduction?: number | null;
  otherDeduction?: number | null;
  totalDeduction: number;
  netPay: number;
  status: PayrollStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  processedBy?: string | null;
  processedAt?: string | null;
  remarks?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface PayrollRunRequest {
  yearMonth: string;
  requestedBy?: string;
  source?: string;
}

export interface PayrollRunResponse {
  status: string;
  payrollRunId: number;
  yearMonth: string;
  periodStart: string;
  periodEnd: string;
}

export interface PayrollWorkflowResponse {
  payrollId: number;
  status: PayrollStatus;
  message: string;
  approvedBy?: string;
  approvedAt?: string | null;
  rejectedBy?: string;
  rejectedAt?: string;
  processedBy?: string;
  processedAt?: string | null;
  reason?: string;
}
