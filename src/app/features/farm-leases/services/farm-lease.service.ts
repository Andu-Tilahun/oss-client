import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {LeaseAgreement, LeaseCreateRequest, LeaseFilterRequest,} from '../models/farm-lease.model';
import {ApiResponse, PageResponse} from '../../../shared/models/api-response.model';
import {AssignExtensionWorkerRequest} from "../../assign-extension-worker-request";
import {InvestmentRecord} from "../../crowd-funding/models/crowd-funding.model";

@Injectable({
  providedIn: 'root',
})
export class FarmLeaseService {
  constructor(private httpService: HttpService) {
  }

  filterLeases(request: LeaseFilterRequest): Observable<PageResponse<LeaseAgreement>> {
    return this.httpService.post<PageResponse<LeaseAgreement>>(
      `${Endpoints.FARM_LEASES_ENDPOINT}/filter`,
      request,
    );
  }

  getLeaseById(id: string): Observable<ApiResponse<LeaseAgreement>> {
    return this.httpService.get<ApiResponse<LeaseAgreement>>(`${Endpoints.FARM_LEASES_ENDPOINT}/${id}`);
  }

  createLease(request: LeaseCreateRequest): Observable<ApiResponse<LeaseAgreement>> {
    return this.httpService.post<ApiResponse<LeaseAgreement>>(Endpoints.FARM_LEASES_ENDPOINT, request);
  }

  update(id: string, request: LeaseCreateRequest): Observable<ApiResponse<LeaseAgreement>> {
    return this.httpService.put<ApiResponse<LeaseAgreement>>(`${Endpoints.FARM_LEASES_ENDPOINT}/${id}`, request);
  }

  adminDecideLease(leaseId: string, decision: 'ACCEPTED' | 'REJECTED'): Observable<ApiResponse<LeaseAgreement>> {
    return this.httpService.post<ApiResponse<LeaseAgreement>>(
      `${Endpoints.FARM_LEASES_ENDPOINT}/${leaseId}/admin/decision`,
      { leaseStatus: decision },
    );
  }

  assignExtensionWorker(request: AssignExtensionWorkerRequest): Observable<ApiResponse<LeaseAgreement>> {
    return this.httpService.post<ApiResponse<LeaseAgreement>>(
      `${Endpoints.FARM_LEASES_ENDPOINT}/assign-extension-worker`,
      request,
    );
  }

  send(leaseId: string): Observable<ApiResponse<LeaseAgreement>> {
    return this.httpService.put<ApiResponse<LeaseAgreement>>(
      `${Endpoints.FARM_LEASES_ENDPOINT}/${leaseId}/send`,
      null,
    );
  }
}

