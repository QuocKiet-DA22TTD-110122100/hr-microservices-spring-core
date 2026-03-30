export interface Department extends Record<string, unknown> {
  id: string;
  code: string;
  name: string;
  description?: string;
  managerId?: string;
  managerName?: string;
  parentDepartmentId?: string;
  parentDepartmentName?: string;
  employeeCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentRequest {
  code: string;
  name: string;
  description?: string;
  managerId?: string;
  parentDepartmentId?: string;
}

export interface UpdateDepartmentRequest extends Partial<CreateDepartmentRequest> {
  status?: 'ACTIVE' | 'INACTIVE';
}
