export interface Branch {
    id?: number,
    name: string,
    address: string,
    cityId: number,
    code: string
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
          cities: [
            {
              id: number,
              name: string
            }
          ]
        }
      }
    }

    export interface PagingBranch {
         perPage: number,
         currentPage: number,
         totalRecords: number,
         totalPages: number
    }