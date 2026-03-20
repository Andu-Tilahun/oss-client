import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {LeaseAgreement, LeaseCreateRequest, LeaseGenerateTermsRequest} from '../models/farm-lease.model';

@Injectable({
  providedIn: 'root',
})
export class FarmLeaseService {
  constructor(private httpService: HttpService) {}

  createLease(request: LeaseCreateRequest): Observable<LeaseAgreement> {
    return this.httpService.post<LeaseAgreement>(Endpoints.FARM_LEASES_ENDPOINT, request);
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

  confirmLease(leaseId: string): Observable<LeaseAgreement> {
    return this.httpService.post<LeaseAgreement>(
      `${Endpoints.FARM_LEASES_ENDPOINT}/${leaseId}/confirm`,
      {},
    );
  }
}

