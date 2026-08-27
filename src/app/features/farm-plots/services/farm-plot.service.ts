import {Injectable} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {HttpService, RequestType} from '../../../core/services/http.service';
import {ApiResponse, PageResponse} from '../../../shared/models/api-response.model';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {
  FarmGallery,
  FarmGalleryCreateRequest,
  FarmPlot,
  FarmPlotFilterRequest,
  FarmPlotMaintenanceRequest,
  FarmPlotRequest,
} from '../models/farm-plot.model';
import {ExportNotificationRequest} from '../../../shared/models/export-notification-request.model';

@Injectable({
  providedIn: 'root',
})
export class FarmPlotService {
  constructor(private httpService: HttpService) {}

  getAllFarmPlots(page: number = 0, size: number = 10): Observable<PageResponse<FarmPlot>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.httpService.get<PageResponse<FarmPlot>>(Endpoints.FARM_PLOTS_ENDPOINT, undefined, params);
  }

  /** Unauthenticated listing of active plots (public marketing site). */
  getPublicActiveFarmPlots(page: number = 0, size: number = 10): Observable<PageResponse<FarmPlot>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.httpService.get<PageResponse<FarmPlot>>(
      `${Endpoints.FARM_PLOTS_ENDPOINT}/public/active`,
      undefined,
      params,
      {requestType: RequestType.LOCAL, skipAuthRedirect: true},
    );
  }

  filterFarmPlots(request: FarmPlotFilterRequest): Observable<PageResponse<FarmPlot>> {
    return this.httpService.post<PageResponse<FarmPlot>>(`${Endpoints.FARM_PLOTS_ENDPOINT}/filter`, request);
  }

  /** Operational tab: status bucket is enforced server-side. */
  filterOperationalFarmPlots(request: FarmPlotFilterRequest): Observable<PageResponse<FarmPlot>> {
    return this.httpService.post<PageResponse<FarmPlot>>(`${Endpoints.FARM_PLOTS_ENDPOINT}/filter/operational`, request);
  }

  /** Repair/Damaged tab: status bucket is enforced server-side. */
  filterRepairFarmPlots(request: FarmPlotFilterRequest): Observable<PageResponse<FarmPlot>> {
    return this.httpService.post<PageResponse<FarmPlot>>(`${Endpoints.FARM_PLOTS_ENDPOINT}/filter/repair`, request);
  }

  /** Archived tab: status bucket is enforced server-side. */
  filterArchivedFarmPlots(request: FarmPlotFilterRequest): Observable<PageResponse<FarmPlot>> {
    return this.httpService.post<PageResponse<FarmPlot>>(`${Endpoints.FARM_PLOTS_ENDPOINT}/filter/archived`, request);
  }

  getFarmPlotById(id: string): Observable<FarmPlot> {
    return this.httpService.get<FarmPlot>(`${Endpoints.FARM_PLOTS_ENDPOINT}/${id}`);
  }

  getFarmPlotGallery(id: string): Observable<FarmGallery[]> {
    return this.httpService.get<FarmGallery[]>(`${Endpoints.FARM_PLOTS_ENDPOINT}/${id}/gallery`);
  }

  getPublicFarmPlotGallery(id: string): Observable<FarmGallery[]> {
    return this.httpService.get<FarmGallery[]>(
      `${Endpoints.FARM_PLOTS_ENDPOINT}/public/gallery/${id}`,
      undefined,
      undefined,
      {requestType: RequestType.LOCAL, skipAuthRedirect: true},
    );
  }

  getPublicFarmPlotGalleryByPlotId(id: string): Observable<FarmGallery[]> {
    return this.httpService.get<FarmGallery[]>(
      `${Endpoints.FARM_PLOTS_ENDPOINT}/${id}/gallery`,
      undefined,
      undefined,
      {requestType: RequestType.LOCAL, skipAuthRedirect: true},
    );
  }

  addFarmPlotGalleryImage(id: string, request: FarmGalleryCreateRequest): Observable<FarmGallery> {
    return this.httpService.post<FarmGallery>(`${Endpoints.FARM_PLOTS_ENDPOINT}/${id}/gallery`, request);
  }

  deleteFarmPlotGalleryImage(id: string, galleryId: string): Observable<void> {
    return this.httpService.delete<void>(`${Endpoints.FARM_PLOTS_ENDPOINT}/${id}/gallery/${galleryId}`);
  }

  createFarmPlot(request: FarmPlotRequest): Observable<FarmPlot> {
    return this.httpService.post<FarmPlot>(Endpoints.FARM_PLOTS_ENDPOINT, request);
  }

  updateFarmPlot(id: string, request: FarmPlotRequest): Observable<FarmPlot> {
    return this.httpService.put<FarmPlot>(`${Endpoints.FARM_PLOTS_ENDPOINT}/${id}`, request);
  }

  deactivateFarmPlot(id: string): Observable<ApiResponse<void>> {
    return this.httpService.put<ApiResponse<void>>(`${Endpoints.FARM_PLOTS_ENDPOINT}/${id}/deactivate`, null);
  }

  markUnderMaintenance(id: string, request: FarmPlotMaintenanceRequest): Observable<FarmPlot> {
    return this.httpService.put<FarmPlot>(`${Endpoints.FARM_PLOTS_ENDPOINT}/${id}/mark-under-maintenance`, request);
  }

  markRepaired(id: string): Observable<FarmPlot> {
    return this.httpService.put<FarmPlot>(`${Endpoints.FARM_PLOTS_ENDPOINT}/${id}/mark-repaired`, null);
  }

  notifyExport(request: ExportNotificationRequest): Observable<ApiResponse<void>> {
    return this.httpService.post<ApiResponse<void>>(`${Endpoints.FARM_PLOTS_ENDPOINT}/exports/notify`, request);
  }
}

