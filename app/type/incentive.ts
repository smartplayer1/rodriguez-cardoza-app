
// ==================== INTERFACES ====================
export interface IncentiveResponse {
  records: Promotion[];
  paging: {
    perPage: number;
    currentPage: number;
    totalRecords: number;
    totalPages: number;
  };
}

export interface Coupon {
  id: number;
  name: string;
  amount: number;
  expirationDate: string;
  isActive: boolean;
}

export interface ProductVolumeCondition {
  id: number;
  articleCode: string;
}

export interface RewardProduct {
  id: number;
  articleCode: string;
  quantity: number;
}

export interface RewardCoupon {
  id: number;
  couponId: number;
  coupon: Coupon;
}


export interface Promotion {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  withdrawalStartDate: string;
  withdrawalDeadline: string;
  ruleType: 'ProductVolume' | 'AmountPurchased' | 'Mixed';
  description: string;
  isActive: boolean;
  amountCondition: number;
  productVolumeTargetQuantity: number;
  maxWinsPerClient: number | null;
  participantClientType: 'Promotor'|'Asesor' | 'Ambos';
  currency?: string;
  createdAt?: string;
  productVolumeConditions: ProductVolumeCondition[];
  rewardProducts: RewardProduct[];
  rewardCoupons: RewardCoupon[];
}

export interface IncentivoGenerado {
  id: number;
  reglaId: number;
  reglaNombre: string;
  asesorId: number;
  asesorNombre: string;
  fechaGeneracion: string;
  fechaEntrega?: string;
  estado: 'generado' | 'pendiente' | 'entregado';
  productosIncentivo: RewardProduct[];
  cuponesIncentivo: RewardCoupon[];
  tipoCumplimiento: 'productos' | 'monto';
  montoComprado?: number;
  productosComprados?: ProductVolumeCondition[];
}

export interface Paging {
  perPage: number;
  currentPage: number;
  totalRecords: number;
  totalPages: number;
}

export interface PromotionResponse {
  records: Promotion[];
  paging: Paging;
}

export interface CreatePromotionRequest {
  name: string;
  startDate: string;
  endDate: string;
  withdrawalStartDate: string;
  withdrawalDeadline: string;
  ruleType: 'ProductVolume' | 'AmountPurchased' | 'Mixed';
  description: string;
  isActive: boolean;
  amountCondition: number;
  productVolumeTargetQuantity: number;
  maxWinsPerClient: number | null;
  participantClientType: 'Promotor'|'Asesor' | 'Ambos';
  productVolumeConditions: {
    articleCode: string;
  }[];
  rewardProducts: {
    articleCode: string;
    quantity: number;
  }[];
  rewardCoupons: {
    couponId: number;
  }[];
}


export interface Incentive {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  withdrawalStartDate: string;
  withdrawalDeadline: string;
  ruleType: 'ProductVolume' | 'AmountPurchased' | 'Mixed';
  description: string;
  isActive: boolean;
  amountCondition: number;
  productVolumeTargetQuantity: number;
  maxWinsPerClient: number | null;
  participantClientType: 'Promotor'|'Asesor' | 'Ambos';
  productVolumeConditions: ProductVolumeCondition[];
  rewardProducts: RewardProduct[];
  rewardCoupons: RewardCoupon[];
}
