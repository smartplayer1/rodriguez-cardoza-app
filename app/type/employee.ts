export interface EmployeeRole {
  id: number;
  name: string;
  description: string;
}

export interface EmployeeBranch {
  id: number;
  name: string;
  address: string;
  code: string;
  city: {
    id: number;
    name: string;
    state: {
      id: number;
      name: string;
      cities: {
        id: number;
        name: string;
      }[];
    };
  };
}

export interface EmployeeRecord {
  id: number;
  code: string;
  firstname: string;
  middleName: string;
  lastName: string;
  secondLastName: string;
  phoneNumber: string;
  idNumber: string;
  jobRole: EmployeeRole;
  branch: EmployeeBranch;
}

export interface EmployeeListResponse {
  records: EmployeeRecord[];
  paging: {
    perPage: number;
    currentPage: number;
    totalRecords: number;
    totalPages: number;
  };
}

export interface EmployeeCreatePayload {
  code: string;
  name: string;
  middleName: string;
  lastName: string;
  secondLastName: string;
  phoneNumber: string;
  idNumber: string;
  jobRoleId: number;
  branchId: number;
}

export type EmployeeFilters = {
  code?: string;
  name?: string;
  middleName?: string;
  LastName?: string;
  SecondLastName?: string;
  phoneNumber?: string;
  jobRoleId?: string;
  branchId?: string;
  page?: number;
  perPage?: number;
  baseUrl?: string;
  cookieHeader?: string;
};