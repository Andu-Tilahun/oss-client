export type ReplacementReason = 'Broken' | 'Lost' | 'Damaged';
export type ItemStatus = 'New' | 'Available' | 'Borrowed' | 'Replacement' | 'Damaged' | 'Retired';

export interface ReplacementRecord {
  id: string;
  oldItemId: string;
  oldItemSerialNumber?: string | null;
  oldItemName?: string | null;
  newItemId: string;
  newItemSerialNumber?: string | null;
  newItemName?: string | null;
  employeeId: string;
  employeeCode?: string | null;
  employeeName?: string | null;
  reason: ReplacementReason;
  replacedAt: string;
  notes?: string | null;
}

export interface ConfirmReplacementRequest {
  oldBorrowRecordId: string;
  newItemId: string;
  reason: ReplacementReason;
  oldItemFinalStatus: 'Retired' | 'Damaged';
  notes?: string | null;
}

