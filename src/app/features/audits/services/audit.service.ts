import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import { Endpoints } from '../../../core/endpoint/endpoint.model';
import { PageResponse } from '../../../shared/models/api-response.model';
import { AuditLog } from '../models/audit.model';

@Injectable({
  providedIn: 'root'
})
export class AuditService {

  constructor(private httpService: HttpService) {
  }

  getAllAudits(
    page: number = 0,
    size: number = 20,
    sortBy: string = 'createdAt',
    sortDir: string = 'DESC'
  ): Observable<PageResponse<AuditLog>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    return this.httpService.get<PageResponse<AuditLog>>(
      Endpoints.AUDITS_ENDPOINT,
      undefined,
      params
    );
  }

  getAuditById(id: number): Observable<AuditLog> {
    return this.httpService.get<AuditLog>(`${Endpoints.AUDITS_ENDPOINT}/${id}`);
  }
}

