export interface Branch {
    id?: number,
    name: string,
    address: string,
    cityId: number,
    code: string
}

export interface UpdateBranchPayload {
    name?: string | null;
    address?: string | null;
    cityId?: number | null;
    code?: string | null;
}

export interface GetBranchesFilters {
    id?: number;
    code?: string;
    name?: string;
    address?: string;
    page?: number;
    perPage?: number;
    skip?: number;
    baseUrl?: string;
    cookieHeader?: string;
}

export interface BranchResponse {
   records: RecordsBranch[]
   paging: PagingBranch
}

export interface RecordsBranch {
      id: number,
      name: string,
      address: string,
      code: string,
      city: {
        id: number,
        name: string,
        state: {
          id: number,
          name: string,
        }
      }
    }

    export interface PagingBranch {
         perPage: number,
         currentPage: number,
         totalRecords: number,
         totalPages: number
    }
