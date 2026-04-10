export type FarmPlotStatus = 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE' | 'ASSIGNED_TO_LEASE';
export type FarmPlotSizeType = 'ACRES' | 'HECTARES';
export type FarmPlotSoilType = 'SANDY' | 'CLAY' | 'LOAMY';

export interface FarmPlot {
  id: string;
  title: string;
  description?: string;
  size: number;
  sizeType: FarmPlotSizeType;
  latitude: number;
  longitude: number;
  soilType: FarmPlotSoilType;
  status: FarmPlotStatus;
  imageUuid?: string;

  createdBy?: string;
  createdAt?: Date;
  updatedBy?: string;
  updatedAt?: Date;
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

