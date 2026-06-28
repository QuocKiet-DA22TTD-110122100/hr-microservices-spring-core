import apiClient from '@/utils/axios';

export interface AiSuggestion {
  id: string;
  assigneeId: string;
  title: string;
  reason: string;
  workload: number;
  confidence: number;
}

export interface AiRiskRadarItem {
  id: string;
  projectId: number;
  projectName: string;
  severity: 'warning' | 'danger';
  summary: string;
  highPriorityTaskCount: number;
  progress: number;
}

export const aiApi = {
  getSuggestions: async (): Promise<AiSuggestion[]> => {
    const response = await apiClient.get<AiSuggestion[]>('/v1/ai/suggestions');
    return response.data;
  },

  getRiskRadar: async (): Promise<AiRiskRadarItem[]> => {
    const response = await apiClient.get<AiRiskRadarItem[]>('/v1/ai/risk-radar');
    return response.data;
  },
};
