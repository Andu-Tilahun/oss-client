export interface WorkflowFilterRequest {
  searchText?: string;
  requestTypes?: string[];
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}

