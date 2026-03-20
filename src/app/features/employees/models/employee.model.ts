export type EmployeeStatus = 'Active' | 'Inactive';
export type Gender = 'Male' | 'Female' | 'Other' | 'PREFER_NOT_TO_SAY';

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  position?: string;
  departmentId?: string;
  departmentName?: string;
  gender: Gender;
  age?: number;
  status: EmployeeStatus;
  photoId?: string;
}

export interface EmployeeRequest {
  name: string;
  position?: string;
  departmentId?: string;
  gender: Gender;
  age?: number;
  status?: EmployeeStatus;
  photoId?: string;
}

export interface EmployeeFilterRequest {
  searchText?: string;
  statuses?: EmployeeStatus[];
  departmentId?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}
