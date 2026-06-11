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
} from '../models/investment-package.model';
import {AssignExtensionWorkerRequest} from "../../assign-extension-worker-request";
import {LeaseAgreement} from "../../farm-leases/models/farm-lease.model";

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

  create(request: InvestmentPackageCreateRequest): Observable<ApiResponse<InvestmentPackage>> {
    return this.httpService.post<ApiResponse<InvestmentPackage>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}`,
      request,
    );
  }

  updateInvestmentPackage(crowdFundingId: string, request: InvestmentPackageCreateRequest): Observable<ApiResponse<InvestmentPackage>> {
    return this.httpService.put<ApiResponse<InvestmentPackage>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/${crowdFundingId}`,
      request,
    );
  }

  deleteInvestmentPackage(id: string): Observable<ApiResponse<void>> {
    return this.httpService.delete<ApiResponse<void>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/${id}`,
    );
  }

  getInvestmentPackageById(crowdFundingId: string): Observable<ApiResponse<InvestmentPackage>> {
    return this.httpService.get<ApiResponse<InvestmentPackage>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/${crowdFundingId}`,
    );
  }

  // Investments
  filterInvestments(request: InvestmentFilterRequest): Observable<PageResponse<InvestmentRecord>> {
    return this.httpService.put<PageResponse<InvestmentRecord>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/investments/filter`,
      request,
    );
  }

  createInvestment(request: InvestmentCreateRequest): Observable<ApiResponse<InvestmentRecord>> {
    return this.httpService.post<ApiResponse<InvestmentRecord>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/investmentRecord`,
      request,
    );
  }

  createInvestmentRecord(request: InvestmentRecordCreateRequest): Observable<ApiResponse<InvestmentRecord>> {
    return this.httpService.post<ApiResponse<InvestmentRecord>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/investmentRecord`,
      request,
    );
  }

  adminSetRoi(investmentId: string, roi: string): Observable<ApiResponse<InvestmentRecord>> {
    return this.httpService.post<ApiResponse<InvestmentRecord>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/investments/${investmentId}/admin/roi`,
      {roi},
    );
  }

  send(investmentId: string): Observable<ApiResponse<InvestmentRecord>> {
    return this.httpService.put<ApiResponse<InvestmentRecord>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/investments/${investmentId}/send`,
      null,
    );
  }

  cancel(investmentId: string): Observable<ApiResponse<InvestmentRecord>> {
    return this.httpService.put<ApiResponse<InvestmentRecord>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/investments/${investmentId}/cancel`,
      null,
    );
  }


  investorDecision(investmentId: string, decision: 'ACCEPTED' | 'REJECTED'): Observable<ApiResponse<InvestmentRecord>> {
    return this.httpService.post<ApiResponse<InvestmentRecord>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/investments/${investmentId}/investor/decision`,
      { investmentStatus: decision },
    );
  }

  assignExtensionWorker(request: AssignExtensionWorkerRequest): Observable<ApiResponse<InvestmentPackage>> {
    return this.httpService.post<ApiResponse<InvestmentPackage>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/assign-extension-worker`,
      request,
    );
  }
}

