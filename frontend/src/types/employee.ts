export interface Employee extends Record<string, unknown> {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address: string;
  position: string;
  departmentId: string;
  departmentName?: string;
  hireDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  salary?: number;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeRequest {
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address: string;
  position: string;
  departmentId: string;
  hireDate: string;
  salary?: number;
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
}
