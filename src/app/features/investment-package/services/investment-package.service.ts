import {Injectable} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {HttpService, RequestType} from '../../../core/services/http.service';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {ApiResponse, PageResponse} from '../../../shared/models/api-response.model';
import {
  InvestmentPackage,
  InvestmentPackageCreateRequest,
  InvestmentPackageFilterRequest,
  InvestmentCreateRequest,
  InvestmentFilterRequest,
  InvestmentRecord,
  InvestmentRecordCreateRequest,
  ChooseCandidatesRequest,
  InvestmentAgreement,
  InvestmentAgreementFilterRequest,
  InvestmentPackageStatusSummary,
  CreateInvestmentAgreementRequest,
  InvestorAgreeResponseRequest,
} from '../models/investment-package.model';
import {AssignExtensionWorkerRequest, ChangeExtensionWorkerRequest} from "../../assign-extension-worker-request";
import {FarmPlot} from '../../farm-plots/models/farm-plot.model';
import {User} from '../../users/models/user.model';

@Injectable({providedIn: 'root'})
export class InvestmentPackageService {
  constructor(private httpService: HttpService) {
  }

  /** Unauthenticated listing of investment packages (public marketing site). */
  getPublicInvestmentPackages(page: number = 0, size: number = 10): Observable<PageResponse<InvestmentPackage>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.httpService.get<PageResponse<InvestmentPackage>>(
      Endpoints.INVESTMENT_PACKAGES_ENDPOINT,
      undefined,
      params,
      {requestType: RequestType.LOCAL, skipAuthRedirect: true},
    );
  }

  // investmentPackages (admin create, admin/investor view)
  filterInvestmentPackages(request: InvestmentPackageFilterRequest): Observable<PageResponse<InvestmentPackage>> {
    return this.httpService.put<PageResponse<InvestmentPackage>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/filter`,
      request,
    );
  }

  /** Published Investments tab: packageStatus bucket is enforced server-side. */
  filterPublishedInvestmentPackages(request: InvestmentPackageFilterRequest): Observable<PageResponse<InvestmentPackage>> {
    return this.httpService.put<PageResponse<InvestmentPackage>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/filter/published`,
      request,
    );
  }

  /** Archived Investments tab: packageStatus bucket is enforced server-side. */
  filterArchivedInvestmentPackages(request: InvestmentPackageFilterRequest): Observable<PageResponse<InvestmentPackage>> {
    return this.httpService.put<PageResponse<InvestmentPackage>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/filter/archived`,
      request, undefined, {requestType: RequestType.LOCAL},
    );
  }

  /** Farm plots the admin can pick when creating a new investment package. */
  getEligibleFarmPlots(): Observable<FarmPlot[]> {
    return this.httpService.get<FarmPlot[]>(`${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/eligible-farm-plots`);
  }

  create(request: InvestmentPackageCreateRequest): Observable<ApiResponse<InvestmentPackage>> {
    return this.httpService.post<ApiResponse<InvestmentPackage>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}`,
      request, undefined, {requestType: RequestType.LOCAL},
    );
  }

  updateInvestmentPackage(crowdFundingId: string, request: InvestmentPackageCreateRequest): Observable<ApiResponse<InvestmentPackage>> {
    return this.httpService.put<ApiResponse<InvestmentPackage>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/${crowdFundingId}`,
      request, undefined, {requestType: RequestType.LOCAL},
    );
  }

  closeInvestmentPackage(id: string, reason: string): Observable<ApiResponse<InvestmentPackage>> {
    return this.httpService.put<ApiResponse<InvestmentPackage>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/${id}/close`,
      {reason}, undefined, {requestType: RequestType.LOCAL},
    );
  }

  completeInvestmentPackage(id: string, remark: string): Observable<ApiResponse<InvestmentPackage>> {
    return this.httpService.put<ApiResponse<InvestmentPackage>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/${id}/complete`,
      {remark}, undefined, {requestType: RequestType.LOCAL},
    );
  }

  deactivateInvestmentPackage(id: string, reason: string): Observable<ApiResponse<InvestmentPackage>> {
    return this.httpService.put<ApiResponse<InvestmentPackage>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/${id}/deactivate`,
      {reason}, undefined, {requestType: RequestType.LOCAL},
    );
  }

  togglePackageStatus(id: string): Observable<ApiResponse<InvestmentPackage>> {
    return this.httpService.patch<ApiResponse<InvestmentPackage>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/${id}/status`,
      {},
    );
  }

  getInvestmentPackageById(crowdFundingId: string): Observable<ApiResponse<InvestmentPackage>> {
    return this.httpService.get<ApiResponse<InvestmentPackage>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/${crowdFundingId}`,
    );
  }

  getClosedLeaseInvestors(packageId: string): Observable<User[]> {
    return this.httpService.get<User[]>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/${packageId}/closed-lease-investors`,
      undefined, undefined, {requestType: RequestType.LOCAL},
    );
  }

  // Investments
  filterInvestments(request: InvestmentFilterRequest): Observable<PageResponse<InvestmentRecord>> {
    return this.httpService.put<PageResponse<InvestmentRecord>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/investmentRecord/filter`,
      request,
    );
  }

  getBiddingLeaderboard(packageId: string): Observable<InvestmentRecord[]> {
    return this.httpService.get<InvestmentRecord[]>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/${packageId}/leaderboard`,
    );
  }

  createInvestment(request: InvestmentCreateRequest): Observable<ApiResponse<InvestmentRecord>> {
    return this.httpService.post<ApiResponse<InvestmentRecord>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/investmentRecord`,
      request, undefined, {requestType: RequestType.LOCAL},
    );
  }

  createInvestmentRecord(request: InvestmentRecordCreateRequest): Observable<ApiResponse<InvestmentRecord>> {
    return this.httpService.post<ApiResponse<InvestmentRecord>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/investmentRecord`,
      request, undefined, {requestType: RequestType.LOCAL},
    );
  }

  send(investmentId: string): Observable<ApiResponse<InvestmentRecord>> {
    return this.httpService.put<ApiResponse<InvestmentRecord>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/investments/${investmentId}/send`,
      null, undefined, {requestType: RequestType.LOCAL},
    );
  }

  cancel(investmentId: string): Observable<ApiResponse<InvestmentRecord>> {
    return this.httpService.put<ApiResponse<InvestmentRecord>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/investmentRecord/${investmentId}/cancel`,
      null, undefined, {requestType: RequestType.LOCAL},
    );
  }


  investorDecision(investmentId: string, decision: 'ACCEPTED' | 'REJECTED', reason?: string): Observable<ApiResponse<InvestmentRecord>> {
    return this.httpService.put<ApiResponse<InvestmentRecord>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/investments/${investmentId}/investor/decision`,
      { investmentStatus: decision, ...(reason ? { reason } : {}) }, undefined, {requestType: RequestType.LOCAL},
    );
  }

  assignExtensionWorker(request: AssignExtensionWorkerRequest): Observable<InvestmentPackage> {
    return this.httpService.post<InvestmentPackage>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/assign-extension-worker`,
      request, undefined, {requestType: RequestType.LOCAL},
    );
  }

  changeExtensionWorker(request: ChangeExtensionWorkerRequest): Observable<InvestmentPackage> {
    return this.httpService.put<InvestmentPackage>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/assign-extension-worker/change`,
      request, undefined, {requestType: RequestType.LOCAL},
    );
  }

  getInvestmentRecordByPackageId(investmentPackageId: string): Observable<InvestmentRecord> {
    return this.httpService.get<InvestmentRecord>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/investmentRecord/${investmentPackageId}`,
    );
  }

  chooseCandidates(request: ChooseCandidatesRequest): Observable<ApiResponse<InvestmentPackage>> {
    return this.httpService.put<ApiResponse<InvestmentPackage>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/investmentRecord/choose-candidates`,
      request, undefined, {requestType: RequestType.LOCAL},
    );
  }

  investorAgreeResponse(request: InvestorAgreeResponseRequest): Observable<ApiResponse<InvestmentRecord>> {
    return this.httpService.put<ApiResponse<InvestmentRecord>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/investmentRecord/choose-candidates/investor-agree-response`,
      request, undefined, {requestType: RequestType.LOCAL},
    );
  }

  createAgreement(request: CreateInvestmentAgreementRequest): Observable<InvestmentAgreement> {
    return this.httpService.post<InvestmentAgreement>(
      Endpoints.INVESTMENT_AGGREMENT_ENDPOINT,
      request, undefined, {requestType: RequestType.LOCAL},
    );
  }

  getAgreementById(agreementId: string): Observable<InvestmentAgreement> {
    return this.httpService.get<InvestmentAgreement>(
      `${Endpoints.INVESTMENT_AGGREMENT_ENDPOINT}/${agreementId}`,
      undefined, undefined, {requestType: RequestType.LOCAL},
    );
  }

  activateAgreement(agreementId: string): Observable<InvestmentAgreement> {
    return this.httpService.put<InvestmentAgreement>(
      `${Endpoints.INVESTMENT_AGGREMENT_ENDPOINT}/${agreementId}/activate`,
      null, undefined, {requestType: RequestType.LOCAL},
    );
  }

  filterAgreements(request: InvestmentAgreementFilterRequest): Observable<PageResponse<InvestmentAgreement>> {
    return this.httpService.post<PageResponse<InvestmentAgreement>>(
      `${Endpoints.INVESTMENT_AGGREMENT_ENDPOINT}/filter`,
      request,
    );
  }

  /** Platform-wide aggregate counts only — no row-level data, safe for investors. */
  getStatusSummary(): Observable<InvestmentPackageStatusSummary> {
    return this.httpService.get<InvestmentPackageStatusSummary>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/status-summary`,
    );
  }
}

