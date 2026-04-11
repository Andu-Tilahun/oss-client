import {User} from "../../users/models/user.model";
import {FarmPlot} from "../../farm-plots/models/farm-plot.model";
import {FarmFollowUp} from "../../farm-followups/models/farm-followup.model";

export type FarmActivity = 'CROPS' | 'LIVE_STOCKS' | 'AGRO_FORESTRY';
export type WaterSource = 'IRRIGATION' | 'RIVER_ACCESS' | 'RAIN_FED';

export type FundingStatus = 'OPEN' | 'ACTIVE' | 'CLOSED' | 'FUNDED' | 'FAILED';

export type InvestmentPaymentMethod = 'CREDIT' | 'BANK_TRANSFER' | 'CRYPTO';
export type InvestmentStatus = 'PAID' | 'SENT' | 'ACTIVE' | 'PENDING' | 'FAILED' | 'ACCEPTED'| 'REJECTED';

export interface CrowdFunding {
  id: string;
  farmPlotId: string;
  startDate: string;
  endDate: string;
  farmActivity: FarmActivity;
  waterSource: WaterSource;
  title: string;
  targetAmount: number;
  minimumContribution: number;
  fundingDeadline: string;
  fundingStatus: FundingStatus;
  farmPlot: FarmPlot;
  followUpDtoList: FarmFollowUp[];
  description?: string;
  extensionWorker: User;
}

export interface CrowdFundingCreateRequest {
  farmPlotId: string;
  startDate: string;
  endDate: string;
  farmActivity: FarmActivity;
  waterSource: WaterSource;
  title: string;
  targetAmount: number;
  minimumContribution: number;
  fundingDeadline: string;
  fundingStatus?: FundingStatus;
  description?: string;
}

export interface CrowdFundingFilterRequest {
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
  crowdFunding?: CrowdFunding;
  investorUser: User;
}

export interface InvestmentCreateRequest {
  crowdFundingId: string;
  amount: number;
  paymentMethod: InvestmentPaymentMethod;
}

export interface InvestmentFilterRequest {
  searchText?: string;
  statuses?: InvestmentStatus[];
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}

