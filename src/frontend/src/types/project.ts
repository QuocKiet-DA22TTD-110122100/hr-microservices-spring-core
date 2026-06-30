export type ProjectStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

export type ProjectRole = 'MEMBER' | 'DEVELOPER' | 'QA' | 'MANAGER';

export interface Project {
  id: number;
  name: string;
  description?: string | null;
  status: ProjectStatus;
  leadId: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ProjectAssignment {
  id: number;
  projectId: number;
  employeeId: number;
  role: ProjectRole;
  active: boolean;
  assignedAt: string;
}

export interface ProjectRequest {
  name: string;
  description?: string | null;
  status?: ProjectStatus | null;
  leadId: number;
}

export interface ProjectAssignmentRequest {
  employeeId: number;
  role: ProjectRole;
}

export type ProjectSortKey = 'name' | 'status' | 'leadId' | 'createdAt';
