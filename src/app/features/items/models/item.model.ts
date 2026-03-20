export type ItemCondition = 'New' | 'Good' | 'Fair' | 'Damaged';
export type ItemStatus = 'New' | 'Available' | 'Borrowed' | 'Replacement' | 'Damaged' | 'Retired';

export interface Item {
  id: string;
  itemTypeId: string;
  itemTypeName?: string;
  serialNumber: string;
  name?: string;
  condition: ItemCondition;
  status: ItemStatus;
  note?: string;
  purchaseDate?: string;
}

export interface ItemRequest {
  itemTypeId: string;
  serialNumber: string;
  name?: string;
  condition: ItemCondition;
  status: ItemStatus;
  note?: string;
  purchaseDate?: string;
}

export interface ItemFilterRequest {
  searchText?: string;
  itemTypeId?: string;
  statuses?: ItemStatus[];
  conditions?: ItemCondition[];
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}
