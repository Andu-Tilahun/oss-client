import {User} from "../../users/models/user.model";
import {FarmPlot, FarmPlotSoilType} from "../../farm-plots/models/farm-plot.model";
import {FarmFollowUp} from "../../farm-followups/models/farm-followup.model";
import {FundingStatus} from "../../../shared/models/funding-status.model";

export {FundingStatus, FUNDING_STATUSES} from "../../../shared/models/funding-status.model";

export type InvestmentPackageStatus = 'ACTIVE' | 'INACTIVE' | 'IN_USE';
export type FarmActivity = 'CROPS' | 'LIVE_STOCKS' | 'AGRO_FORESTRY';
export type WaterSource = 'IRRIGATION' | 'RIVER_ACCESS' | 'RAIN_FED';
export type InvestmentPackageType = 'CROWDFUNDING' | 'BIDDING' | 'LEASING';

export type InvestmentPaymentMethod = 'CREDIT' | 'BANK_TRANSFER' | 'CRYPTO';
export type InvestmentStatus = 'PAID' | 'SENT' | 'ACTIVE' | 'PENDING' | 'FAILED' | 'ACCEPTED'| 'REJECTED' | 'CANCELED' | 'BACKUP';
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
  investorId?: string;
  investorUser?: User;
  farmPlot: FarmPlot;
  followUpDtoList?: FarmFollowUp[];
  description?: string;
  extensionWorker?: User;
  status?: string;
  packageStatus?: InvestmentPackageStatus;
  closureReason?: string;
  createdAt?: string;
  updatedAt?: string;
  allowedPaymentMethods?: InvestmentPaymentMethod[];
  allowedBankAccountIds?: string[];
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
  allowedPaymentMethods?: InvestmentPaymentMethod[];
  allowedBankAccountIds?: string[];
}

export interface InvestmentPackageFilterRequest {
  searchText?: string;
  statuses?: FundingStatus[];
  paymentStatuses?: InvestmentPaymentStatus[];
  soilTypes?: FarmPlotSoilType[];
  farmPlotId?: string;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}

export interface InvestmentRecord {
  id: string;
  investmentPackageId: string;
  investorId: string;
  amount: number;
  paymentMethod: InvestmentPaymentMethod;
  roi?: string;
  status: InvestmentStatus;
  paymentStatus?: InvestmentPaymentStatus;
  investmentPackage?: InvestmentPackage;
  investorUser?: User;
  bankAccountId?: string;
  paymentReference?: string;
  attachmentId?: string;
  signedAt?: string | null;
  rejectionReason?: string | null;
}

export interface InvestmentCreateRequest {
  investmentPackageId: string;
  amount: number;
  paymentMethod: InvestmentPaymentMethod;
  bankAccountId?: string;
}

export interface InvestmentRecordCreateRequest {
  investmentPackageId: string;
  amount: number;
  paymentMethod: InvestmentPaymentMethod;
  attachmentId: string;
  bankAccountId?: string;
}

export interface ChooseCandidatesRequest {
  investmentPackageId: string;
  farmPlotId: string;
  investorIds: string[];
  remark: string;
}

export interface InvestmentAgreement {
  id: string;
  farmPlotId: string;
  investmentPackageId: string;
  investorIdList: string[];
  assignedExtensionWorkerId?: string | null;
  startDate: string;
  endDate: string;
  totalDurationMonths: number;
  status: string;
  totalAmount: number;
  investmentPackageType: InvestmentPackageType;
  farmPlot: FarmPlot;
  investorUser?: User;
  extensionWorker?: User | null;
  followUpDtoList?: FarmFollowUp[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInvestmentAgreementRequest {
  farmPlotId: string;
  investmentPackageId: string;
  paymentStatus: InvestmentPaymentStatus;
}

export interface InvestmentFilterRequest {
  searchText?: string;
  statuses?: InvestmentStatus[];
  investmentPackageIds?: string[];
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}

export interface InvestorAgreeResponseRequest {
  investmentPackageId: string;
  investmentRecordId: string;
  farmPlotId: string;
  attachmentId: string;
}

