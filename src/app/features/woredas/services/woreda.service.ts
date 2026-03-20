import {Injectable} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {ApiResponse, PageResponse} from '../../../shared/models/api-response.model';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {Woreda, WoredaRequest} from '../models/woreda.model';
import {WoredaFilterRequest} from '../pages/woreda-filter/woreda-filter-request';

@Injectable({
  providedIn: 'root'
})
export class WoredaService {

  constructor(private httpService: HttpService) {
  }

  getAllWoredas(page: number = 0, size: number = 10): Observable<PageResponse<Woreda>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.httpService.get<PageResponse<Woreda>>(
      Endpoints.WOREDAS_ENDPOINT,
      undefined,
      params
    );
  }

  filterWoredas(request: WoredaFilterRequest): Observable<PageResponse<Woreda>> {
    return this.httpService.post<PageResponse<Woreda>>(
      `${Endpoints.WOREDAS_ENDPOINT}/filter`,
      request
    );
  }

  getWoredaById(id: string): Observable<ApiResponse<Woreda>> {
    return this.httpService.get<ApiResponse<Woreda>>(
      `${Endpoints.WOREDAS_ENDPOINT}/${id}`,
    );
  }

  createWoreda(request: WoredaRequest): Observable<ApiResponse<Woreda>> {
    return this.httpService.post<ApiResponse<Woreda>>(
      Endpoints.WOREDAS_ENDPOINT,
      request
    );
  }

  updateWoreda(id: string, request: WoredaRequest): Observable<ApiResponse<Woreda>> {
    return this.httpService.put<ApiResponse<Woreda>>(
      `${Endpoints.WOREDAS_ENDPOINT}/${id}`,
      request,
    );
  }

  deleteWoreda(id: string): Observable<ApiResponse<void>> {
    return this.httpService.delete<ApiResponse<void>>(
      `${Endpoints.WOREDAS_ENDPOINT}/${id}`,
    );
  }
}

