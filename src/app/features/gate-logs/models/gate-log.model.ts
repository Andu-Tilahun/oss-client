export type ScanType = 'CHECK_IN' | 'CHECK_OUT';

export interface GateLog {
  id: string;
  employeeId: string;
  employeeCode?: string | null;
  employeeName?: string | null;
  itemId: string;
  itemSerialNumber?: string | null;
  itemName?: string | null;
  scanType: ScanType;
  scannedCheckinAt?: string | null;
  scannedCheckoutAt?: string | null;
  scannedBy: string;
  createdAt: string;
}

export interface GateScanRequest {
  employeeId?: string | null;
  itemId?: string | null;
  scannedBy: string;
}

