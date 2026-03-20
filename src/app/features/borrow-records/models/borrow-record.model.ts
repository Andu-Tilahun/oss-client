import { ItemCondition } from '../../items/models/item.model';

export type BorrowRecordStatus =
  | 'Active'
  | 'Returned'
  | 'Lost'
  | 'Replaced'
  | 'Transferred';

export interface BorrowRecord {
  id: string;
  employeeId: string;
  employeeCode?: string | null;
  employeeName?: string | null;
  itemId: string;
  itemSerialNumber?: string | null;
  itemName?: string | null;
  itemTypeId?: string | null;
  itemTypeName?: string | null;
  borrowedAt: string;
  returnedAt?: string | null;
  conditionAtBorrow: ItemCondition;
  conditionAtReturn?: ItemCondition | null;
  status: BorrowRecordStatus;
}

export interface BorrowRequest {
  employeeId: string;
  itemId: string;
  conditionAtBorrow: ItemCondition;
}

export interface ReturnRequest {
  conditionAtReturn: ItemCondition;
}

