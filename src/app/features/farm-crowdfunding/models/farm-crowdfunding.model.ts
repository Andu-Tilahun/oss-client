export type FarmActivity = 'CROPS' | 'LIVE_STOCKS' | 'AGRO_FORESTRY';
export type WaterSource = 'IRRIGATION' | 'RIVER_ACCESS' | 'RAIN_FED';

export type FundingStatus = 'OPEN' | 'CLOSED' | 'FUNDED' | 'FAILED';

export type InvestmentPaymentMethod = 'CREDIT' | 'BANK_TRANSFER' | 'CRYPTO';
export type InvestmentStatus = 'PAID' | 'ACTIVE' | 'PENDING' | 'FAILED';
export type InvestmentApprovalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface FarmOperation {
  id: string;
  farmPlotId: string;
  startDate: string; // yyyy-MM-dd
  endDate: string; // yyyy-MM-dd
  farmActivity: FarmActivity;
  waterSource: WaterSource;
}

export interface FarmOperationCreateRequest {
  farmPlotId: string;
  startDate: string;
  endDate: string;
  farmActivity: FarmActivity;
  waterSource: WaterSource;
}

export interface FarmOperationFilterRequest {
  searchText?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}

export interface CrowdfundingCampaign {
  id: string;
  farmOperationId: string;
  title: string;
  targetAmount: number;
  minimumContribution: number;
  fundingDeadline: string; // ISO date-time
  fundingStatus: FundingStatus;
  description?: string;
  farmOperation?: FarmOperation;
}

export interface CrowdfundingCampaignCreateRequest {
  farmOperationId: string;
  title: string;
  targetAmount: number;
  minimumContribution: number;
  fundingDeadline: string;
  fundingStatus?: FundingStatus;
  description?: string;
}

export interface CrowdfundingCampaignFilterRequest {
  searchText?: string;
  statuses?: FundingStatus[];
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}

export interface InvestmentRecord {
  id: string;
  crowdFundingId: string;
  investorId: string;
  amount: number;
  paymentMethod: InvestmentPaymentMethod;
  roi?: string;
  status: InvestmentStatus;
  approvalStatus: InvestmentApprovalStatus;
  campaign?: CrowdfundingCampaign;
}

export interface InvestmentCreateRequest {
  crowdFundingId: string;
  amount: number;
  paymentMethod: InvestmentPaymentMethod;
}

export interface InvestmentFilterRequest {
  searchText?: string;
  statuses?: InvestmentStatus[];
  approvalStatuses?: InvestmentApprovalStatus[];
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}

