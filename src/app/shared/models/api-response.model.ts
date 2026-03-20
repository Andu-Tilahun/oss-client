export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: ErrorDetails;
  validationErrors?: ValidationError[];
  correlationId?: string;
  timestamp?: Date;
}

export interface ErrorDetails {
  code: string;
  message: string;
  details?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  rejectedValue?: any;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}
