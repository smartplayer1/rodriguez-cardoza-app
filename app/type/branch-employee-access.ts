export interface BranchEmployeeAccessRecord {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  employeeBranchId: number;
  employeeBranchCode: string;
  employeeBranchName: string;
  userId: number | null;
  userName: string | null;
  roleName: string | null;
  hasAccess: boolean;
}

export interface BranchEmployeesAccess {
  branchId: number;
  branchCode: string;
  branchName: string;
  employees: BranchEmployeeAccessRecord[];
}
