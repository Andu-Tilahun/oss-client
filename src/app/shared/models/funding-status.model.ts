export enum FundingStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  FUNDED = 'FUNDED',
  FAILED = 'FAILED',
}

export const FUNDING_STATUSES: FundingStatus[] = [
  FundingStatus.OPEN,
  FundingStatus.CLOSED,
  FundingStatus.FUNDED,
  FundingStatus.FAILED,
];
