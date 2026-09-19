export type FarmPlotStatus = 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE' | 'ASSIGNED_TO_LEASE' | 'ASSIGNED_TO_BIDDING' | 'ASSIGNED_TO_CROWDFUNDING' | 'ASSIGNED_TO_INVESTMENT_PACKAGE' | 'ASSIGNED';
export type FarmPlotSizeType = 'ACRES' | 'HECTARES';
export type FarmPlotSoilType = 'SANDY' | 'CLAY' | 'LOAMY';

export interface FarmGallery {
  id: string;
  imageUuid: string;
  sortOrder: number;
}

export interface FarmGalleryCreateRequest {
  imageUuid: string;
}

export interface FarmPlotImageDto {
  imageUuid: string;
  farmPlotId: string;
  farmPlotTitle: string;
}

export interface FarmPlot {
  id: string;
  title: string;
  description?: string;
  size: number;
  sizeType: FarmPlotSizeType;
  latitude?: number;
  longitude?: number;
  soilType: FarmPlotSoilType;
  status?: FarmPlotStatus;
  imageUuid?: string;
  regionId?: string;
  gallery?: FarmGallery[];
  maintenanceReason?: string | null;

  createdBy?: string;
  createdAt?: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

export interface FarmPlotMaintenanceRequest {
  reason: string;
}

export interface FarmPlotRequest {
  title: string;
  description?: string;
  size: number;
  sizeType: FarmPlotSizeType;
  latitude: number;
  longitude: number;
  soilType: FarmPlotSoilType;
  status?: FarmPlotStatus;
  imageUuid?: string;
  regionId: string;
}

export interface FarmPlotFilterRequest {
  searchText?: string;
  statuses?: FarmPlotStatus[];
  soilTypes?: FarmPlotSoilType[];
  sizeTypes?: FarmPlotSizeType[];

  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';

  page: number;
  size: number;
}

