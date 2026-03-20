import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpService } from '../../../core/services/http.service';
import { Endpoints } from '../../../core/endpoint/endpoint.model';
import { PageResponse } from '../../../shared/models/api-response.model';
import { NotificationLog } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationLogService {

  constructor(private httpService: HttpService) {
  }

  getNotificationById(id: number): Observable<NotificationLog> {
    return this.httpService.get<NotificationLog>(
      `${Endpoints.NOTIFICATIONS_ENDPOINT}/${id}`,
    );
  }

  getNotifications(
    page: number = 0,
    size: number = 10,
    status?: string,
    priority?: string
  ): Observable<PageResponse<NotificationLog>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status) {
      params = params.set('status', status);
    }

    if (priority) {
      params = params.set('priority', priority);
    }

    return this.httpService.get<PageResponse<NotificationLog>>(
      Endpoints.NOTIFICATIONS_ENDPOINT,
      undefined,
      params
    );
  }
}

