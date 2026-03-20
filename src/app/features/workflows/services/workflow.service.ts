import {Injectable} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {Workflow} from '../models/workflow.model';
import {PageResponse} from '../../../shared/models/api-response.model';
import {WorkflowFilterRequest} from '../pages/workflow-filter/workflow-filter-request';

@Injectable({
  providedIn: 'root'
})
export class WorkflowService {
  private readonly baseEndpoint = Endpoints.WORKFLOWS_ENDPOINT;

  constructor(private httpService: HttpService) {}

  create(workflow: Workflow): Observable<Workflow> {
    return this.httpService.post<Workflow>(
      this.baseEndpoint,
      workflow
    );
  }

  update(id: string, workflow: Workflow): Observable<Workflow> {
    return this.httpService.put<Workflow>(
      `${this.baseEndpoint}/${id}`,
      workflow
    );
  }

  findById(id: string): Observable<Workflow> {
    return this.httpService.get<Workflow>(
      `${this.baseEndpoint}/${id}`,
    );
  }

  findAll(page: number = 0, size: number = 10): Observable<PageResponse<Workflow>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.httpService.get<PageResponse<Workflow>>(
      this.baseEndpoint,
      undefined,
      params
    );
  }

  search(name: string, page: number = 0, size: number = 10): Observable<PageResponse<Workflow>> {
    const params = new HttpParams()
      .set('name', name)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.httpService.get<PageResponse<Workflow>>(
      `${this.baseEndpoint}/search`,
      undefined,
      params
    );
  }

  filterWorkflows(request: WorkflowFilterRequest): Observable<PageResponse<Workflow>> {
    return this.httpService.post<PageResponse<Workflow>>(
      `${this.baseEndpoint}/filter`,
      request
    );
  }

  delete(id: string): Observable<void> {
    return this.httpService.delete<void>(
      `${this.baseEndpoint}/${id}`,
    );
  }
}
