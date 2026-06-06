import apiClient from '@/utils/axios';
import {
  Project,
  ProjectAssignment,
  ProjectAssignmentRequest,
  ProjectRequest,
  ProjectStatus,
} from '@/types/project';

const PROJECT_BASE_PATH = '/projects';

export const projectApi = {
  getAll: async (): Promise<Project[]> => {
    const response = await apiClient.get<Project[]>(PROJECT_BASE_PATH);
    return response.data;
  },

  getById: async (id: number): Promise<Project> => {
    const response = await apiClient.get<Project>(`${PROJECT_BASE_PATH}/${id}`);
    return response.data;
  },

  getByStatus: async (status: ProjectStatus): Promise<Project[]> => {
    const response = await apiClient.get<Project[]>(`${PROJECT_BASE_PATH}/status/${status}`);
    return response.data;
  },

  getByLead: async (leadId: number): Promise<Project[]> => {
    const response = await apiClient.get<Project[]>(`${PROJECT_BASE_PATH}/lead/${leadId}`);
    return response.data;
  },

  create: async (payload: ProjectRequest): Promise<Project> => {
    const response = await apiClient.post<Project>(PROJECT_BASE_PATH, payload);
    return response.data;
  },

  update: async (id: number, payload: ProjectRequest): Promise<Project> => {
    const response = await apiClient.put<Project>(`${PROJECT_BASE_PATH}/${id}`, payload);
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`${PROJECT_BASE_PATH}/${id}`);
  },

  getAssignments: async (projectId: number): Promise<ProjectAssignment[]> => {
    const response = await apiClient.get<ProjectAssignment[]>(`${PROJECT_BASE_PATH}/${projectId}/assignments`);
    return response.data;
  },

  addAssignment: async (projectId: number, payload: ProjectAssignmentRequest): Promise<ProjectAssignment> => {
    const response = await apiClient.post<ProjectAssignment>(`${PROJECT_BASE_PATH}/${projectId}/assignments`, payload);
    return response.data;
  },

  removeAssignment: async (projectId: number, employeeId: number): Promise<void> => {
    await apiClient.delete(`${PROJECT_BASE_PATH}/${projectId}/assignments/${employeeId}`);
  },

  getEmployeeAssignments: async (employeeId: number): Promise<ProjectAssignment[]> => {
    const response = await apiClient.get<ProjectAssignment[]>(`${PROJECT_BASE_PATH}/employees/${employeeId}/assignments`);
    return response.data;
  },
};
