import apiClient from '@/utils/axios';
import {
  PayrollResult,
  PayrollRunRequest,
  PayrollRunResponse,
  PayrollWorkflowResponse,
} from '@/types/payroll';

export const payrollApi = {
  createRun: async (payload: PayrollRunRequest): Promise<PayrollRunResponse> => {
    const response = await apiClient.post<PayrollRunResponse>('/payroll/runs', payload);
    return response.data;
  },

  calculate: async (employeeId: number, yearMonth: string): Promise<PayrollResult> => {
    const response = await apiClient.get<PayrollResult>(`/payroll/${employeeId}/calculate`, {
      params: { yearMonth },
    });
    return response.data;
  },

  getCurrent: async (employeeId: number): Promise<PayrollResult> => {
    const response = await apiClient.get<PayrollResult>(`/payroll/${employeeId}/current`);
    return response.data;
  },

  getHistory: async (employeeId: number): Promise<PayrollResult[]> => {
    const response = await apiClient.get<PayrollResult[]>(`/payroll/${employeeId}/history`);
    return response.data;
  },

  approve: async (payrollId: number): Promise<PayrollWorkflowResponse> => {
    const response = await apiClient.put<PayrollWorkflowResponse>(`/chi-tra/${payrollId}/phe-duyet`);
    return response.data;
  },

  reject: async (payrollId: number, reason: string): Promise<PayrollWorkflowResponse> => {
    const response = await apiClient.put<PayrollWorkflowResponse>(`/chi-tra/${payrollId}/tu-choi`, { reason });
    return response.data;
  },

  process: async (payrollId: number): Promise<PayrollWorkflowResponse> => {
    const response = await apiClient.put<PayrollWorkflowResponse>(`/chi-tra/${payrollId}/xu-ly`);
    return response.data;
  },
};
