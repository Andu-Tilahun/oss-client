import {Injectable} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {ApiResponse, PageResponse} from '../../../shared/models/api-response.model';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {Subcity, SubcityRequest} from '../models/subcity.model';
import {SubcityFilterRequest} from '../pages/subcity-filter/subcity-filter-request';

@Injectable({
  providedIn: 'root'
})
export class SubcityService {

  constructor(private httpService: HttpService) {
  }

  getAllSubcities(page: number = 0, size: number = 10): Observable<PageResponse<Subcity>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.httpService.get<PageResponse<Subcity>>(
      Endpoints.SUBCITIES_ENDPOINT,
      undefined,
      params
    );
  }

  filterSubcities(request: SubcityFilterRequest): Observable<PageResponse<Subcity>> {
    return this.httpService.post<PageResponse<Subcity>>(
      `${Endpoints.SUBCITIES_ENDPOINT}/filter`,
      request
    );
  }

  getSubcityById(id: string): Observable<ApiResponse<Subcity>> {
    return this.httpService.get<ApiResponse<Subcity>>(
      `${Endpoints.SUBCITIES_ENDPOINT}/${id}`,
    );
  }

  createSubcity(request: SubcityRequest): Observable<ApiResponse<Subcity>> {
    return this.httpService.post<ApiResponse<Subcity>>(
      Endpoints.SUBCITIES_ENDPOINT,
      request
    );
  }

  updateSubcity(id: string, request: SubcityRequest): Observable<ApiResponse<Subcity>> {
    return this.httpService.put<ApiResponse<Subcity>>(
      `${Endpoints.SUBCITIES_ENDPOINT}/${id}`,
      request,
    );
  }

  deleteSubcity(id: string): Observable<ApiResponse<void>> {
    return this.httpService.delete<ApiResponse<void>>(
      `${Endpoints.SUBCITIES_ENDPOINT}/${id}`,
    );
  }
}

