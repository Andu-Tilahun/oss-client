export interface TransferRecord {
  id: string;
  itemId: string;
  itemSerialNumber?: string | null;
  itemName?: string | null;
  fromEmployeeId: string;
  fromEmployeeCode?: string | null;
  fromEmployeeName?: string | null;
  toEmployeeId: string;
  toEmployeeCode?: string | null;
  toEmployeeName?: string | null;
  transferredAt: string;
  notes?: string | null;
}

export interface TransferRequest {
  itemId: string;
  fromEmployeeId: string;
  toEmployeeId: string;
  notes?: string | null;
}

