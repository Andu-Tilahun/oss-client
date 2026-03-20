export type PaymentType = 'CLEARING_AGENT_CERTIFICATE_FEE';

export interface ServiceFee {
  id: string;
  paymentType: PaymentType;
  amount: number; // backend BigDecimal -> number
  description?: string;
  active: boolean;
  endDate?: string; // ISO string
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceFeeRequest {
  paymentType: PaymentType;
  amount: number;
  description?: string;
}

export interface ServiceFeeCreateResult {
  serviceFee: ServiceFee;
  previousDeactivated: boolean;
  previousServiceFeeId?: string | null;
}

