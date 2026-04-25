export interface CompanyProfile {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  contactMobilePhone: string;
  officePhone: string;
  email: string;
  bankAccount: string;
  createdBy?: string;
  createdAt?: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface CompanyProfileRequest {
  name: string;
  latitude: number;
  longitude: number;
  contactMobilePhone: string;
  officePhone: string;
  email: string;
  bankAccount: string;
}
