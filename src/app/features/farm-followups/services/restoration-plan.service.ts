import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpService, RequestType} from '../../../core/services/http.service';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {
  RestorationPlan,
  RestorationPlanCreateRequest,
  RestorationPlanUpdateRequest,
} from '../models/restoration-plan.model';

@Injectable({
  providedIn: 'root',
})
export class RestorationPlanService {
  constructor(private httpService: HttpService) {}

  create(request: RestorationPlanCreateRequest): Observable<RestorationPlan> {
    return this.httpService.post<RestorationPlan>(
      Endpoints.RESTORATION_PLANS_ENDPOINT,
      request,
      undefined,
      {requestType: RequestType.LOCAL},
    );
  }

  listAllForAdmin(): Observable<RestorationPlan[]> {
    return this.httpService.get<RestorationPlan[]>(`${Endpoints.RESTORATION_PLANS_ENDPOINT}/admin`);
  }

  updateByAdmin(planId: string, request: RestorationPlanUpdateRequest): Observable<RestorationPlan> {
    return this.httpService.put<RestorationPlan>(
      `${Endpoints.RESTORATION_PLANS_ENDPOINT}/admin/${planId}`,
      request,
      undefined,
      {requestType: RequestType.LOCAL},
    );
  }

  listForWorker(): Observable<RestorationPlan[]> {
    return this.httpService.get<RestorationPlan[]>(`${Endpoints.RESTORATION_PLANS_ENDPOINT}/extension-worker`);
  }

  updateByWorker(planId: string, request: RestorationPlanUpdateRequest): Observable<RestorationPlan> {
    return this.httpService.put<RestorationPlan>(
      `${Endpoints.RESTORATION_PLANS_ENDPOINT}/extension-worker/${planId}`,
      request,
      undefined,
      {requestType: RequestType.LOCAL},
    );
  }
}
