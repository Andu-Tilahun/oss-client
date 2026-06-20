export interface AssignExtensionWorkerRequest {
  extensionWorkerId: string;
  investmentPackageId: string;
  agreementId: string;
  farmPlotId: string;
  investmentRecordId: string;
}

export interface ChangeExtensionWorkerRequest {
  investmentPackageId: string;
  agreementId: string;
  extensionWorkerId: string;
  description?: string;
}
