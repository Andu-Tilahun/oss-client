import {User} from "../../users/models/user.model";
import {FarmPlot, FarmPlotSoilType} from "../../farm-plots/models/farm-plot.model";
import {FarmFollowUp} from "../../farm-followups/models/farm-followup.model";

export type FarmActivity = 'CROPS' | 'LIVE_STOCKS' | 'AGRO_FORESTRY';
export type WaterSource = 'IRRIGATION' | 'RIVER_ACCESS' | 'RAIN_FED';
export type InvestmentPackageType = 'CROWDFUNDING' | 'BIDDING' | 'LEASING';

export type FundingStatus = 'PENDING' | 'OPEN' | 'ACTIVE' | 'CLOSED' | 'FUNDED' | 'FAILED';

export type InvestmentPaymentMethod = 'CREDIT' | 'BANK_TRANSFER' | 'CRYPTO';
export type InvestmentStatus = 'PAID' | 'SENT' | 'ACTIVE' | 'PENDING' | 'FAILED' | 'ACCEPTED'| 'REJECTED';
export type InvestmentPaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface InvestmentPackage {
  id: string;
  farmPlotId: string;
  startDate: string;
  endDate: string;
  farmActivity: FarmActivity;
  waterSource: WaterSource;
  title: string;
  targetAmount: number;
  minimumContribution: number;
  fundingDeadline?: string;
  fundingStatus: FundingStatus;
  investmentPackageType?: InvestmentPackageType;
  expectedInvestorNumber?: number;
  remark?: string;
  agreementId?: string | null;
  paidDate?: string | null;
  attachmentIdList?: string[];
  paymentStatus?: InvestmentPaymentStatus;
  investorIdList?: string[];
  farmPlot: FarmPlot;
  followUpDtoList?: FarmFollowUp[];
  description?: string;
  extensionWorker?: User;
}

export interface InvestmentPackageCreateRequest {
  farmPlotId: string;
  title: string;
  startDate: string;
  endDate: string;
  targetAmount: number;
  minimumContribution: number;
  expectedInvestorNumber: number;
  fundingDeadline: string;
  investmentPackageType: InvestmentPackageType;
  farmActivity: FarmActivity;
  waterSource: WaterSource;
  description?: string;
  remark?: string;
  fundingStatus?: FundingStatus;
}

export interface InvestmentPackageFilterRequest {
  searchText?: string;
  statuses?: FundingStatus[];
  paymentStatuses?: InvestmentPaymentStatus[];
  soilTypes?: FarmPlotSoilType[];
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
  crowdFunding?: InvestmentPackage;
  investorUser: User;
}

export interface InvestmentCreateRequest {
  crowdFundingId: string;
  amount: number;
  paymentMethod: InvestmentPaymentMethod;
}

export interface InvestmentRecordCreateRequest {
  investmentPackageId: string;
  amount: number;
  paymentMethod: InvestmentPaymentMethod;
  attachmentId: string;
}

export interface InvestmentFilterRequest {
  searchText?: string;
  statuses?: InvestmentStatus[];
  crowdFundingIds?: string[];
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}

