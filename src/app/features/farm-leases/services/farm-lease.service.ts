import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ApiResponse} from '../../../shared/models/api-response.model';
import {HttpService} from '../../../core/services/http.service';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {LeaseAgreement, LeaseCreateRequest, LeaseGenerateTermsRequest} from '../models/farm-lease.model';

@Injectable({
  providedIn: 'root',
})
export class FarmLeaseService {
  constructor(private httpService: HttpService) {}

  createLease(request: LeaseCreateRequest): Observable<ApiResponse<LeaseAgreement>> {
    return this.httpService.post<ApiResponse<LeaseAgreement>>(Endpoints.FARM_LEASES_ENDPOINT, request);
  }

  generateTerms(
    leaseId: string,
    request: LeaseGenerateTermsRequest,
  ): Observable<ApiResponse<LeaseAgreement>> {
    return this.httpService.post<ApiResponse<LeaseAgreement>>(
      `${Endpoints.FARM_LEASES_ENDPOINT}/${leaseId}/terms/generate`,
      request,
    );
  }

  confirmLease(leaseId: string): Observable<ApiResponse<LeaseAgreement>> {
    return this.httpService.post<ApiResponse<LeaseAgreement>>(
      `${Endpoints.FARM_LEASES_ENDPOINT}/${leaseId}/confirm`,
      {},
    );
  }
}

