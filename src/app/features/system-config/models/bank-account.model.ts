export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  branchName?: string;
  swiftCode?: string;
  description?: string;
  active: boolean;
  displayOrder: number;
}

export interface BankAccountRequest {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  branchName?: string;
  swiftCode?: string;
  description?: string;
  active: boolean;
  displayOrder: number;
}
