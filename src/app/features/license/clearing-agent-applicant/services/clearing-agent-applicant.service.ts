import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../../core/services/http.service';
import { Endpoints } from '../../../../core/endpoint/endpoint.model';
import {
  ClearingAgentApplicant,
  ClearingAgentApplicantCreateRequest,
  ClearingAgentApplicantFilterRequest,
  ClearingAgentDocumentRequest,
} from '../models/clearing-agent-applicant.model';
import { PageResponse } from '../../../../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ClearingAgentApplicantService {
  constructor(private httpService: HttpService) {}

  create(request: ClearingAgentApplicantCreateRequest): Observable<ClearingAgentApplicant> {
    return this.httpService.post<ClearingAgentApplicant>(
      Endpoints.CLEARING_AGENT_APPLICANTS_ENDPOINT,
      request,
    );
  }

  update(id: string, request: ClearingAgentApplicantCreateRequest): Observable<ClearingAgentApplicant> {
    return this.httpService.put<ClearingAgentApplicant>(
      `${Endpoints.CLEARING_AGENT_APPLICANTS_ENDPOINT}/${id}`,
      request,
    );
  }

  saveDocuments(id: string, documents: ClearingAgentDocumentRequest[]): Observable<ClearingAgentApplicant> {
    return this.httpService.put<ClearingAgentApplicant>(
      `${Endpoints.CLEARING_AGENT_APPLICANTS_ENDPOINT}/${id}/documents`,
      documents,
    );
  }

  submit(id: string): Observable<ClearingAgentApplicant> {
    return this.httpService.put<ClearingAgentApplicant>(
      `${Endpoints.CLEARING_AGENT_APPLICANTS_ENDPOINT}/${id}/submit`,
      {},
    );
  }

  getByReferenceNumber(referenceNumber: string): Observable<ClearingAgentApplicant> {
    return this.httpService.get<ClearingAgentApplicant>(
      `${Endpoints.CLEARING_AGENT_APPLICANTS_ENDPOINT}/by-reference/${referenceNumber}`,
    );
  }

  getByUserRequestId(userRequestId: string): Observable<ClearingAgentApplicant> {
    return this.httpService.get<ClearingAgentApplicant>(
      `${Endpoints.CLEARING_AGENT_APPLICANTS_ENDPOINT}/by-user-request/${userRequestId}`,
    );
  }

  filter(request: ClearingAgentApplicantFilterRequest): Observable<PageResponse<ClearingAgentApplicant>> {
    return this.httpService.post<PageResponse<ClearingAgentApplicant>>(
      `${Endpoints.CLEARING_AGENT_APPLICANTS_ENDPOINT}/filter`,
      request,
    );
  }
}

