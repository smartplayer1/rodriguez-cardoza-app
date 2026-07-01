export interface JobRoleRecord {
  id: number;
  name: string;
  description: string;
}

export interface JobRoleResponse {
  records: JobRoleRecord[];
  paging: {
    perPage: number;
    currentPage: number;
    totalRecords: number;
    totalPages: number;
  };
}

export interface JobRolePayload {
  id?: number;
  name: string;
  description: string;
}
