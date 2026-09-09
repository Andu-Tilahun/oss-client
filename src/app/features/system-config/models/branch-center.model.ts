export interface BranchCenter {
  id?: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  operatingHours?: string;
}

export type BranchCenterRequest = Omit<BranchCenter, 'id'>;
