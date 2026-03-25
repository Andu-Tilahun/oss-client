import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {
  LeaseAgreement,
  LeaseCreateRequest,
  LeaseDefineTermsRequest,
  LeaseFilterRequest,
  LeaseGenerateTermsRequest,
} from '../models/farm-lease.model';
import {PageResponse} from '../../../shared/models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class FarmLeaseService {
  constructor(private httpService: HttpService) {}

  filterLeases(request: LeaseFilterRequest): Observable<PageResponse<LeaseAgreement>> {
    return this.httpService.post<PageResponse<LeaseAgreement>>(
      `${Endpoints.FARM_LEASES_ENDPOINT}/filter`,
      request,
    );
  }

  getLeaseById(id: string): Observable<LeaseAgreement> {
    return this.httpService.get<LeaseAgreement>(`${Endpoints.FARM_LEASES_ENDPOINT}/${id}`);
  }

  createLease(request: LeaseCreateRequest): Observable<LeaseAgreement> {
    return this.httpService.post<LeaseAgreement>(Endpoints.FARM_LEASES_ENDPOINT, request);
  }

  updateLease(id: string, request: LeaseCreateRequest): Observable<LeaseAgreement> {
    return this.httpService.put<LeaseAgreement>(`${Endpoints.FARM_LEASES_ENDPOINT}/${id}`, request);
  }

  generateTerms(
    leaseId: string,
    request: LeaseGenerateTermsRequest,
  ): Observable<LeaseAgreement> {
    return this.httpService.post<LeaseAgreement>(
      `${Endpoints.FARM_LEASES_ENDPOINT}/${leaseId}/terms/generate`,
      request,
    );
  }

  defineCustomTerms(leaseId: string, request: LeaseDefineTermsRequest): Observable<LeaseAgreement> {
    return this.httpService.post<LeaseAgreement>(
      `${Endpoints.FARM_LEASES_ENDPOINT}/${leaseId}/terms/define`,
      request,
    );
  }

  confirmLease(leaseId: string): Observable<LeaseAgreement> {
    return this.httpService.post<LeaseAgreement>(
      `${Endpoints.FARM_LEASES_ENDPOINT}/${leaseId}/confirm`,
      {},
    );
  }

  adminDecideLease(leaseId: string, decision: 'APPROVE' | 'REJECT'): Observable<LeaseAgreement> {
    return this.httpService.post<LeaseAgreement>(
      `${Endpoints.FARM_LEASES_ENDPOINT}/${leaseId}/admin/decision`,
      {decision},
    );
  }
}

