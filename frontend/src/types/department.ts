export interface Department extends Record<string, unknown> {
  id: number;
  name: string;
  code?: string;
  organizationUnitId?: number;
  organizationUnitName?: string;
}

export interface CreateDepartmentRequest {
  name: string;
  code?: string;
  organizationUnitId?: number;
}

export interface UpdateDepartmentRequest extends Partial<CreateDepartmentRequest> {
}
