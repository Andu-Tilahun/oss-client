export interface SubcityFilterRequest {
  searchText?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}

