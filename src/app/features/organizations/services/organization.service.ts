import {Injectable} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {ApiResponse, PageResponse} from '../../../shared/models/api-response.model';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {Organization, OrganizationRequest} from '../models/organization.model';
import {OrganizationFilterRequest} from '../pages/organization-filter/organization-filter-request';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {

  constructor(private httpService: HttpService) {
  }

  getAllOrganizations(page: number = 0, size: number = 10): Observable<PageResponse<Organization>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.httpService.get<PageResponse<Organization>>(
      Endpoints.ORGANIZATIONS_ENDPOINT,
      undefined,
      params
    );
  }

  filterOrganizations(request: OrganizationFilterRequest): Observable<PageResponse<Organization>> {
    return this.httpService.post<PageResponse<Organization>>(
      `${Endpoints.ORGANIZATIONS_ENDPOINT}/filter`,
      request
    );
  }

  getOrganizationById(id: string): Observable<ApiResponse<Organization>> {
    return this.httpService.get<ApiResponse<Organization>>(
      `${Endpoints.ORGANIZATIONS_ENDPOINT}/${id}`,
    );
  }

  createOrganization(request: OrganizationRequest): Observable<ApiResponse<Organization>> {
    return this.httpService.post<ApiResponse<Organization>>(
      Endpoints.ORGANIZATIONS_ENDPOINT,
      request
    );
  }

  updateOrganization(id: string, request: OrganizationRequest): Observable<ApiResponse<Organization>> {
    return this.httpService.put<ApiResponse<Organization>>(
      `${Endpoints.ORGANIZATIONS_ENDPOINT}/${id}`,
      request,
    );
  }

  deleteOrganization(id: string): Observable<ApiResponse<void>> {
    return this.httpService.delete<ApiResponse<void>>(
      `${Endpoints.ORGANIZATIONS_ENDPOINT}/${id}`,
    );
  }
}

