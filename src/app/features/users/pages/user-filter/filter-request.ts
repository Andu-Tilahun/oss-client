export interface FilterRequest {
  searchText?: string;
  roles?: string[];
  excludeRoles?: string[];
  genders?: string[];
  branches?: string[];
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}
