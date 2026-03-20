export interface OrganizationFilterRequest {
  searchText?: string;
  types?: string[];
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}

