import {Injectable} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {forkJoin, map, Observable, of} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {ApiResponse} from '../../../shared/models/api-response.model';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {EditUserRequestCommand, UserRequest, Workflow} from '../models/user-request.model';

@Injectable({providedIn: 'root'})
export class UserRequestService {
  constructor(private httpService: HttpService) {
  }

  /** Fetch user requests for multiple types. Merges results from each type. */
  getByTypes(requestTypes: string[], status?: string, searchText?: string): Observable<UserRequest[]> {
    if (!requestTypes?.length) return of([]);
    const requests = requestTypes.map((t) => this.getByType(t, undefined, status, searchText));
    return forkJoin(requests).pipe(
      map((arrays) => arrays.flat())
    );
  }

  getByType(requestType: string, requestedBy?: string, status?: string, searchText?: string): Observable<UserRequest[]> {
    let params = new HttpParams();
    if (requestedBy) params = params.set('requestedBy', requestedBy);
    if (status) params = params.set('status', status);
    if (searchText) params = params.set('searchText', searchText);

    return this.httpService.get<UserRequest[]>(
      `${Endpoints.USER_REQUESTS_ENDPOINT}/userRequestType/${requestType}`,
      undefined,
      params
    );
  }

  getById(id: string): Observable<UserRequest> {
    return this.httpService.get<UserRequest>(
      `${Endpoints.USER_REQUESTS_ENDPOINT}/id/${id}`,
    );
  }

  process(command: EditUserRequestCommand): Observable<ApiResponse<UserRequest>> {
    return this.httpService.put<ApiResponse<UserRequest>>(
      `${Endpoints.USER_REQUESTS_ENDPOINT}/process`,
      command
    );
  }

  getTransitions(requestType: string, currentStatus: string): Observable<Workflow> {
    return this.httpService.get<Workflow>(
      `${Endpoints.WORKFLOWS_ENDPOINT}/userRequestType/${requestType}/workflowStatuses/${currentStatus}`,
    );
  }
}
