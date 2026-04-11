import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {ApiResponse, PageResponse} from '../../../shared/models/api-response.model';
import {
  CrowdFunding,
  CrowdFundingCreateRequest,
  CrowdFundingFilterRequest,
  InvestmentCreateRequest,
  InvestmentFilterRequest,
  InvestmentRecord,
} from '../models/crowd-funding.model';
import {AssignExtensionWorkerRequest} from "../../assign-extension-worker-request";
import {LeaseAgreement} from "../../farm-leases/models/farm-lease.model";

@Injectable({providedIn: 'root'})
export class CrowdFundingService {
  constructor(private httpService: HttpService) {
  }

  // crowdFundings (admin create, admin/investor view)
  filterCrowdFunding(request: CrowdFundingFilterRequest): Observable<PageResponse<CrowdFunding>> {
    return this.httpService.post<PageResponse<CrowdFunding>>(
      `${Endpoints.FARM_CROWDFUNDING_ENDPOINT}/filter`,
      request,
    );
  }

  create(request: CrowdFundingCreateRequest): Observable<ApiResponse<CrowdFunding>> {
    return this.httpService.post<ApiResponse<CrowdFunding>>(
      `${Endpoints.FARM_CROWDFUNDING_ENDPOINT}`,
      request,
    );
  }

  updatecrowdFunding(crowdFundingId: string, request: CrowdFundingCreateRequest): Observable<ApiResponse<CrowdFunding>> {
    return this.httpService.put<ApiResponse<CrowdFunding>>(
      `${Endpoints.FARM_CROWDFUNDING_ENDPOINT}/${crowdFundingId}`,
      request,
    );
  }

  getcrowdFundingById(crowdFundingId: string): Observable<ApiResponse<CrowdFunding>> {
    return this.httpService.get<ApiResponse<CrowdFunding>>(
      `${Endpoints.FARM_CROWDFUNDING_ENDPOINT}/${crowdFundingId}`,
    );
  }

  // Investments
  filterInvestments(request: InvestmentFilterRequest): Observable<PageResponse<InvestmentRecord>> {
    return this.httpService.post<PageResponse<InvestmentRecord>>(
      `${Endpoints.FARM_CROWDFUNDING_ENDPOINT}/investments/filter`,
      request,
    );
  }

  createInvestment(request: InvestmentCreateRequest): Observable<ApiResponse<InvestmentRecord>> {
    return this.httpService.post<ApiResponse<InvestmentRecord>>(
      `${Endpoints.FARM_CROWDFUNDING_ENDPOINT}/investments`,
      request,
    );
  }

  adminSetRoi(investmentId: string, roi: string): Observable<ApiResponse<InvestmentRecord>> {
    return this.httpService.post<ApiResponse<InvestmentRecord>>(
      `${Endpoints.FARM_CROWDFUNDING_ENDPOINT}/investments/${investmentId}/admin/roi`,
      {roi},
    );
  }

  send(investmentId: string): Observable<ApiResponse<InvestmentRecord>> {
    return this.httpService.put<ApiResponse<InvestmentRecord>>(
      `${Endpoints.FARM_CROWDFUNDING_ENDPOINT}/investments/${investmentId}/send`,
      null,
    );
  }


  investorDecision(investmentId: string, decision: 'ACCEPTED' | 'REJECTED'): Observable<ApiResponse<InvestmentRecord>> {
    return this.httpService.post<ApiResponse<InvestmentRecord>>(
      `${Endpoints.FARM_CROWDFUNDING_ENDPOINT}/investments/${investmentId}/investor/decision`,
      {decision},
    );
  }

  assignExtensionWorker(request: AssignExtensionWorkerRequest): Observable<ApiResponse<CrowdFunding>> {
    return this.httpService.post<ApiResponse<CrowdFunding>>(
      `${Endpoints.FARM_CROWDFUNDING_ENDPOINT}/assign-extension-worker`,
      request,
    );
  }
}

