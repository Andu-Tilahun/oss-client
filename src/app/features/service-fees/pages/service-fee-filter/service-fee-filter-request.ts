import {PaymentType} from '../../models/service-fee.model';

export interface ServiceFeeFilterRequest {
  searchText?: string;
  paymentTypes?: PaymentType[];
  active?: boolean;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}

