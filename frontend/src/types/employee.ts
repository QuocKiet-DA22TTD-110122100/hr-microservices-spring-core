export interface Employee extends Record<string, unknown> {
  id: number;
  authUserId?: string;
  username?: string;
  did?: string;
  name: string;
  position?: string;
  baseSalary?: number;
  hireDate?: string;
  status?: string;
  departmentId?: number;
  departmentName?: string;
  employeeCode?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  salary?: number;
}

export interface CreateEmployeeRequest {
  authUserId: string;
  name: string;
  position?: string;
  baseSalary: number;
  hireDate: string;
  departmentId: number;
  did?: string;
}

export interface UpdateEmployeeRequest {
  name: string;
  position?: string;
  departmentId?: number;
  did?: string;
}
