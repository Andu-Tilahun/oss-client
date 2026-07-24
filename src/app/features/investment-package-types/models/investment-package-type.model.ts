import {User} from "../../users/models/user.model";
import {FarmPlot, FarmPlotSoilType} from "../../farm-plots/models/farm-plot.model";
import {FarmFollowUp} from "../../farm-followups/models/farm-followup.model";
import {
  FarmActivity,
  InvestmentPackageStatus,
  InvestmentPackageType,
  InvestmentPaymentStatus,
  WaterSource,
} from "../../investment-package/models/investment-package.model";
import {FundingStatus} from "../../../shared/models/funding-status.model";

export type InvestmentPackageTypeStatus = 'ACTIVE' | 'PENDING' | 'TERMINATED' | 'ACCEPTED' | 'SENT';
export type InvestmentPackageTypeTermStatus = 'ACTIVE' | 'PAID' | 'PASSED';

export interface InvestmentPackageTypeTerm {
  id: string;
  scheduledDate: string; // yyyy-MM-dd
  dueDate: string;
  amount: number;
  paidDate?: string;
  status: InvestmentPackageTypeTermStatus;
}

export interface InvestmentPackageTypeAgreement {
  id: string;
  startDate: string;
  endDate: string;
  farmActivity: FarmActivity;
  waterSource: WaterSource;
  title: string;
  agreementId?: string | null;
  targetAmount: number;
  minimumContribution: number;
  paidDate?: string | null;
  attachmentIdList?: string[];
  paymentStatus?: InvestmentPaymentStatus;
  investorIdList?: string[];
  expectedInvestorNumber?: number;
  fundingDeadline?: string;
  fundingStatus: FundingStatus;
  investmentPackageType?: InvestmentPackageType;
  remark?: string | null;
  description?: string;
  farmPlotId?: string;
  farmPlot: FarmPlot;
  followUpDtoList?: FarmFollowUp[];
  extensionWorker?: User | null;
  investorId?: string;
  investorUser?: User;
  totalDurationMonths?: number;
  status?: InvestmentPackageTypeStatus;
  packageStatus?: InvestmentPackageStatus;
  totalAmount?: number;
  terms?: InvestmentPackageTypeTerm[];
}

export interface InvestmentPackageTypeCreateRequest {
  farmPlotId: string;
  startDate: string; // yyyy-MM-dd
  totalDurationMonths: number;
  endDate?: string; // optional
  totalAmount: number;
  leasePaymentLineRequests: InvestmentPackageTypePaymentLine;
}

export interface InvestmentPackageTypeGenerateTermsRequest {
  paymentStartDate: string; // yyyy-MM-dd
}

/** One line in a custom payment schedule (repeater row). */
export interface InvestmentPackageTypePaymentLine {
  dueDate: string; // yyyy-MM-dd
  amount: number;
}

/** Request body for POST .../leases/{id}/terms/define */
export interface InvestmentPackageTypeDefineTermsRequest {
  terms: InvestmentPackageTypePaymentLine[];
}

export interface InvestmentPackageTypeFilterRequest {
  searchText?: string;
  statuses?: FundingStatus[];
  paymentStatuses?: InvestmentPaymentStatus[];
  soilTypes?: FarmPlotSoilType[];
  investmentPackageType?: InvestmentPackageType;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}
