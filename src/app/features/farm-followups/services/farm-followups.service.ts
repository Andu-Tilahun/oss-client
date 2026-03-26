import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {FarmOperation} from '../../farm-crowdfunding/models/farm-crowdfunding.model';
import {LeaseAgreement} from '../../farm-leases/models/farm-lease.model';
import {FarmlandRestorationPlan, FarmOperationFollowUp, LeaseFollowUp, RestorationPlanStatus} from '../models/farm-followups.model';

export interface FollowUpCreateRequest {
  scheduledDate: string; // ISO local datetime
  notify: boolean;
  remark?: string;
  status?: any;
}

export interface FollowUpUpdateRequest {
  status: any;
  followUpRemark?: string;
  issuesEncountered?: string;
  reportDate?: string;
  remark?: string;
  notify?: boolean;
}

export interface RestorationPlanCreateRequest {
  farmPlotId: string;
  startDate: string;
  endDate: string;
  remark?: string;
  assignedTo?: string;
}

export interface RestorationPlanUpdateRequest {
  startDate?: string;
  endDate?: string;
  remark?: string;
  assignedTo?: string;
  followUpRemark?: string;
  issuesEncountered?: string;
  reportDate?: string;
  status?: RestorationPlanStatus;
}

@Injectable({providedIn: 'root'})
export class FarmFollowUpsService {
  constructor(private httpService: HttpService) {}

  // Extension worker: assigned operations/leases
  getAssignedFarmOperations(): Observable<FarmOperation[]> {
    return this.httpService.get<FarmOperation[]>(`${Endpoints.FARM_FOLLOWUPS_ENDPOINT}/extension-worker/farm-operations/assigned`);
  }

  getAssignedLeases(): Observable<LeaseAgreement[]> {
    return this.httpService.get<LeaseAgreement[]>(`${Endpoints.FARM_FOLLOWUPS_ENDPOINT}/extension-worker/leases/assigned`);
  }

  // Extension worker: follow-ups (already created)
  getFarmOperationFollowUps(): Observable<FarmOperationFollowUp[]> {
    return this.httpService.get<FarmOperationFollowUp[]>(`${Endpoints.FARM_FOLLOWUPS_ENDPOINT}/extension-worker/farm-operations`);
  }

  getLeaseFollowUps(): Observable<LeaseFollowUp[]> {
    return this.httpService.get<LeaseFollowUp[]>(`${Endpoints.FARM_FOLLOWUPS_ENDPOINT}/extension-worker/leases`);
  }

  // Create schedule
  createFarmOperationFollowUp(operationId: string, request: FollowUpCreateRequest): Observable<FarmOperationFollowUp> {
    return this.httpService.post<FarmOperationFollowUp>(
      `${Endpoints.FARM_FOLLOWUPS_ENDPOINT}/extension-worker/farm-operations/${operationId}/followups`,
      request
    );
  }

  createLeaseFollowUp(leaseId: string, request: FollowUpCreateRequest): Observable<LeaseFollowUp> {
    return this.httpService.post<LeaseFollowUp>(
      `${Endpoints.FARM_FOLLOWUPS_ENDPOINT}/extension-worker/leases/${leaseId}/followups`,
      request
    );
  }

  // Update follow-up details / status
  updateFarmOperationFollowUp(followUpId: string, request: FollowUpUpdateRequest): Observable<FarmOperationFollowUp> {
    return this.httpService.put<FarmOperationFollowUp>(
      `${Endpoints.FARM_FOLLOWUPS_ENDPOINT}/extension-worker/farm-operations/followups/${followUpId}`,
      request
    );
  }

  updateLeaseFollowUp(followUpId: string, request: FollowUpUpdateRequest): Observable<LeaseFollowUp> {
    return this.httpService.put<LeaseFollowUp>(
      `${Endpoints.FARM_FOLLOWUPS_ENDPOINT}/extension-worker/leases/followups/${followUpId}`,
      request
    );
  }

  // Investor/Admin history
  getLeaseFollowUpsHistory(leaseId: string): Observable<LeaseFollowUp[]> {
    return this.httpService.get<LeaseFollowUp[]>(`${Endpoints.FARM_FOLLOWUPS_ENDPOINT}/leases/${leaseId}`);
  }

  getFarmOperationFollowUpsHistory(operationId: string): Observable<FarmOperationFollowUp[]> {
    return this.httpService.get<FarmOperationFollowUp[]>(`${Endpoints.FARM_FOLLOWUPS_ENDPOINT}/farm-operations/${operationId}`);
  }

  getRestorationPlansForAdmin(): Observable<FarmlandRestorationPlan[]> {
    return this.httpService.get<FarmlandRestorationPlan[]>('/farm/restoration-plans/admin');
  }

  createRestorationPlan(request: RestorationPlanCreateRequest): Observable<FarmlandRestorationPlan> {
    return this.httpService.post<FarmlandRestorationPlan>('/farm/restoration-plans', request);
  }

  updateRestorationPlanByAdmin(planId: string, request: RestorationPlanUpdateRequest): Observable<FarmlandRestorationPlan> {
    return this.httpService.put<FarmlandRestorationPlan>(`/farm/restoration-plans/admin/${planId}`, request);
  }

  getAssignedRestorationPlansForWorker(): Observable<FarmlandRestorationPlan[]> {
    return this.httpService.get<FarmlandRestorationPlan[]>('/farm/restoration-plans/extension-worker');
  }

  updateRestorationPlanByWorker(planId: string, request: RestorationPlanUpdateRequest): Observable<FarmlandRestorationPlan> {
    return this.httpService.put<FarmlandRestorationPlan>(`/farm/restoration-plans/extension-worker/${planId}`, request);
  }
}

