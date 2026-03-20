import {Injectable} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {ApiResponse, PageResponse} from '../../../shared/models/api-response.model';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {Region, RegionRequest} from '../models/region.model';
import {RegionFilterRequest} from '../pages/region-filter/region-filter-request';

@Injectable({
  providedIn: 'root'
})
export class RegionService {

  constructor(private httpService: HttpService) {
  }

  getAllRegions(page: number = 0, size: number = 10): Observable<PageResponse<Region>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.httpService.get<PageResponse<Region>>(
      Endpoints.REGIONS_ENDPOINT,
      undefined,
      params
    );
  }

  filterRegions(request: RegionFilterRequest): Observable<PageResponse<Region>> {
    return this.httpService.post<PageResponse<Region>>(
      `${Endpoints.REGIONS_ENDPOINT}/filter`,
      request
    );
  }

  getRegionById(id: string): Observable<ApiResponse<Region>> {
    return this.httpService.get<ApiResponse<Region>>(
      `${Endpoints.REGIONS_ENDPOINT}/${id}`,
    );
  }

  createRegion(request: RegionRequest): Observable<ApiResponse<Region>> {
    return this.httpService.post<ApiResponse<Region>>(
      Endpoints.REGIONS_ENDPOINT,
      request
    );
  }

  updateRegion(id: string, request: RegionRequest): Observable<ApiResponse<Region>> {
    return this.httpService.put<ApiResponse<Region>>(
      `${Endpoints.REGIONS_ENDPOINT}/${id}`,
      request,
    );
  }

  deleteRegion(id: string): Observable<ApiResponse<void>> {
    return this.httpService.delete<ApiResponse<void>>(
      `${Endpoints.REGIONS_ENDPOINT}/${id}`,
    );
  }
}

