export interface CouponRecord {
  id: number;
  name: string;
  amount: number;
  expirationDate: string;
  isActive: boolean;
}

export interface CouponResponse {
  records: CouponRecord[];
  paging: {
    perPage: number;
    currentPage: number;
    totalRecords: number;
    totalPages: number;
  };
}

export interface CreateCouponPayload {
  name: string;
  amount: number;
  expirationDate: string;
  isActive: boolean;
}
