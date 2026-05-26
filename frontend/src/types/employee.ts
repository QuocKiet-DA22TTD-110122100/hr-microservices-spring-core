export interface Employee extends Record<string, unknown> {
  id: number;
  authUserId?: string;
  username?: string;
  name: string;
  position?: string;
  departmentId?: number;
  departmentName?: string;
}

export interface CreateEmployeeRequest {
  name: string;
  position?: string;
  departmentId?: number;
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {
}
