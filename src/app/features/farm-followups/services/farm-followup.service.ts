import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {FarmFollowUp, FarmFollowUpCreateRequest} from '../models/farm-followup.model';

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
}

