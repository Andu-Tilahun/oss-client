export interface PaymentDetail {
  id: string;
  paymentRequestId: string;
  orderNumber: string;
  utility: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  amount: number;
  transactionId?: string;
  dueDate?: string;
  expirationDate?: string;
  paidDate?: string;
  transactionDate?: string;
  createdAt?: string;
  updatedAt?: string;
  paymentDetailStatus: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'DELIVERED';
}

export interface ProcessPaymentRequest {
  transactionId: string;
}
