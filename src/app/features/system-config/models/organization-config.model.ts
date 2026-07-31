export interface OrganizationConfig {
  id?: string;
  name: string;
  tagline?: string;
  address?: string;
  operatingHours?: string;
  logoUuid?: string;
  email?: string;
  phone?: string;
  contactMobilePhone?: string;
  officePhone?: string;
  bankAccount?: string;
  latitude?: number;
  longitude?: number;
  aboutUs?: string;
  updatedAt?: string;
}

export interface OrganizationConfigRequest {
  name: string;
  tagline?: string;
  address?: string;
  operatingHours?: string;
  logoUuid?: string;
  email?: string;
  phone?: string;
  contactMobilePhone?: string;
  officePhone?: string;
  bankAccount?: string;
  latitude?: number;
  longitude?: number;
  aboutUs?: string;
}

export interface OrganizationBasicInfoRequest {
  name: string;
  tagline?: string;
  address?: string;
  operatingHours?: string;
  logoUuid?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface OrganizationContactRequest {
  email?: string;
  phone?: string;
  contactMobilePhone?: string;
  officePhone?: string;
}

export interface OrganizationAboutRequest {
  aboutUs?: string;
}
