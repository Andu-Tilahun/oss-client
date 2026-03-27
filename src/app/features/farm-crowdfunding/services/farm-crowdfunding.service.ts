import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {ApiResponse, PageResponse} from '../../../shared/models/api-response.model';
import {
  CrowdfundingCampaign,
  CrowdfundingCampaignCreateRequest,
  CrowdfundingCampaignFilterRequest,
  FarmOperation,
  FarmOperationCreateRequest,
  FarmOperationFilterRequest,
  InvestmentCreateRequest,
  InvestmentFilterRequest,
  InvestmentRecord,
} from '../models/farm-crowdfunding.model';

@Injectable({providedIn: 'root'})
export class FarmCrowdfundingService {
  constructor(private httpService: HttpService) {}

  // Operations (admin)
  filterOperations(request: FarmOperationFilterRequest): Observable<PageResponse<FarmOperation>> {
    return this.httpService.post<PageResponse<FarmOperation>>(
      `${Endpoints.FARM_CROWDFUNDING_ENDPOINT}/operations/filter`,
      request,
    );
  }

  createOperation(request: FarmOperationCreateRequest): Observable<ApiResponse<FarmOperation>> {
    return this.httpService.post<ApiResponse<FarmOperation>>(`${Endpoints.FARM_CROWDFUNDING_ENDPOINT}/operations`, request);
  }

  updateOperation(operationId: string, request: FarmOperationCreateRequest): Observable<ApiResponse<FarmOperation>> {
    return this.httpService.put<ApiResponse<FarmOperation>>(
      `${Endpoints.FARM_CROWDFUNDING_ENDPOINT}/operations/${operationId}`,
      request,
    );
  }

  getOperationById(operationId: string): Observable<ApiResponse<FarmOperation>> {
    return this.httpService.get<ApiResponse<FarmOperation>>(
      `${Endpoints.FARM_CROWDFUNDING_ENDPOINT}/operations/${operationId}`,
    );
  }

  // Campaigns (admin create, admin/investor view)
  filterCampaigns(request: CrowdfundingCampaignFilterRequest): Observable<PageResponse<CrowdfundingCampaign>> {
    return this.httpService.post<PageResponse<CrowdfundingCampaign>>(
      `${Endpoints.FARM_CROWDFUNDING_ENDPOINT}/campaigns/filter`,
      request,
    );
  }

  createCampaign(request: CrowdfundingCampaignCreateRequest): Observable<ApiResponse<CrowdfundingCampaign>> {
    return this.httpService.post<ApiResponse<CrowdfundingCampaign>>(
      `${Endpoints.FARM_CROWDFUNDING_ENDPOINT}/campaigns`,
      request,
    );
  }

  updateCampaign(campaignId: string, request: CrowdfundingCampaignCreateRequest): Observable<ApiResponse<CrowdfundingCampaign>> {
    return this.httpService.put<ApiResponse<CrowdfundingCampaign>>(
      `${Endpoints.FARM_CROWDFUNDING_ENDPOINT}/campaigns/${campaignId}`,
      request,
    );
  }

  getCampaignById(campaignId: string): Observable<ApiResponse<CrowdfundingCampaign>> {
    return this.httpService.get<ApiResponse<CrowdfundingCampaign>>(
      `${Endpoints.FARM_CROWDFUNDING_ENDPOINT}/campaigns/${campaignId}`,
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

  investorDecision(investmentId: string, decision: 'ACCEPT' | 'REJECT'): Observable<ApiResponse<InvestmentRecord>> {
    return this.httpService.post<ApiResponse<InvestmentRecord>>(
      `${Endpoints.FARM_CROWDFUNDING_ENDPOINT}/investments/${investmentId}/investor/decision`,
      {decision},
    );
  }
}

