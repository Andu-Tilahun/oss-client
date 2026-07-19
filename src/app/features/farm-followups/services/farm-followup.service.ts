import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {
  FarmFollowUp,
  FarmFollowUpCreateRequest,
  FarmFollowUpReport,
  FarmFollowUpReportCreateRequest
} from '../models/farm-followup.model';

@Injectable({
  providedIn: 'root',
})
export class FarmFollowUpService {
  constructor(private httpService: HttpService) {}

  createFollowUp(request: FarmFollowUpCreateRequest): Observable<FarmFollowUp> {
    return this.httpService.post<FarmFollowUp>(Endpoints.FARM_FOLLOWUPS_ENDPOINT, request);
  }

  getByExternalId(externalId: string): Observable<FarmFollowUp[]> {
    return this.httpService.get<FarmFollowUp[]>(`${Endpoints.FARM_FOLLOWUPS_ENDPOINT}/${externalId}`);
  }

  addReport(followUpId: string, request: FarmFollowUpReportCreateRequest): Observable<FarmFollowUpReport> {
    return this.httpService.post<FarmFollowUpReport>(
      `${Endpoints.FARM_FOLLOWUPS_ENDPOINT}/${followUpId}/reports`, request);
  }

  getReports(followUpId: string): Observable<FarmFollowUpReport[]> {
    return this.httpService.get<FarmFollowUpReport[]>(
      `${Endpoints.FARM_FOLLOWUPS_ENDPOINT}/${followUpId}/reports`);
  }
}
