export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: number;
  projectId: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface TaskRequest {
  title: string;
  description?: string | null;
  status?: TaskStatus | null;
  priority?: TaskPriority | null;
  assigneeId: number;
  projectId: number;
}

export type TaskSortKey = 'title' | 'status' | 'priority' | 'assigneeId' | 'projectId' | 'createdAt';
