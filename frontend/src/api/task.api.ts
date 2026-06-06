import apiClient from '@/utils/axios';
import { Task, TaskRequest, TaskStatus } from '@/types/task';

const TASK_BASE_PATH = '/tasks';

export const taskApi = {
  getAll: async (): Promise<Task[]> => {
    const response = await apiClient.get<Task[]>(TASK_BASE_PATH);
    return response.data;
  },

  getById: async (id: number): Promise<Task> => {
    const response = await apiClient.get<Task>(`${TASK_BASE_PATH}/${id}`);
    return response.data;
  },

  getByProject: async (projectId: number): Promise<Task[]> => {
    const response = await apiClient.get<Task[]>(`${TASK_BASE_PATH}/project/${projectId}`);
    return response.data;
  },

  getByAssignee: async (assigneeId: number): Promise<Task[]> => {
    const response = await apiClient.get<Task[]>(`${TASK_BASE_PATH}/assignee/${assigneeId}`);
    return response.data;
  },

  getByStatus: async (status: TaskStatus): Promise<Task[]> => {
    const response = await apiClient.get<Task[]>(`${TASK_BASE_PATH}/status/${status}`);
    return response.data;
  },

  create: async (payload: TaskRequest): Promise<Task> => {
    const response = await apiClient.post<Task>(TASK_BASE_PATH, payload);
    return response.data;
  },

  update: async (id: number, payload: TaskRequest): Promise<Task> => {
    const response = await apiClient.put<Task>(`${TASK_BASE_PATH}/${id}`, payload);
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`${TASK_BASE_PATH}/${id}`);
  },
};
