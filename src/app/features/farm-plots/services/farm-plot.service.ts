import {Injectable} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {ApiResponse, PageResponse} from '../../../shared/models/api-response.model';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {FarmPlot, FarmPlotFilterRequest, FarmPlotRequest} from '../models/farm-plot.model';

@Injectable({
  providedIn: 'root',
})
export class FarmPlotService {
  constructor(private httpService: HttpService) {}

  getAllFarmPlots(page: number = 0, size: number = 10): Observable<PageResponse<FarmPlot>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.httpService.get<PageResponse<FarmPlot>>(Endpoints.FARM_PLOTS_ENDPOINT, undefined, params);
  }

  filterFarmPlots(request: FarmPlotFilterRequest): Observable<PageResponse<FarmPlot>> {
    return this.httpService.post<PageResponse<FarmPlot>>(`${Endpoints.FARM_PLOTS_ENDPOINT}/filter`, request);
  }

  getFarmPlotById(id: string): Observable<FarmPlot> {
    return this.httpService.get<FarmPlot>(`${Endpoints.FARM_PLOTS_ENDPOINT}/${id}`);
  }

  createFarmPlot(request: FarmPlotRequest): Observable<ApiResponse<FarmPlot>> {
    return this.httpService.post<ApiResponse<FarmPlot>>(Endpoints.FARM_PLOTS_ENDPOINT, request);
  }

  updateFarmPlot(id: string, request: FarmPlotRequest): Observable<ApiResponse<FarmPlot>> {
    return this.httpService.put<ApiResponse<FarmPlot>>(`${Endpoints.FARM_PLOTS_ENDPOINT}/${id}`, request);
  }

  deleteFarmPlot(id: string): Observable<ApiResponse<void>> {
    return this.httpService.delete<ApiResponse<void>>(`${Endpoints.FARM_PLOTS_ENDPOINT}/${id}`);
  }
}

