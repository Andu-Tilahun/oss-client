import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpService, RequestOption, RequestType } from '../../../core/services/http.service';
import { Endpoints } from '../../../core/endpoint/endpoint.model';
import { PageResponse } from '../../../shared/models/api-response.model';
import {
  NotificationLog,
  NotificationPriorityValue,
  NotificationStatus,
  NotificationStatusValue,
} from '../models/notification.model';

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
    status?: NotificationStatusValue,
    priority?: NotificationPriorityValue,
    requestOptions?: RequestOption,
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
      params,
      requestOptions,
    );
  }

  getInboxNotifications(
    page: number = 0,
    size: number = 10,
    requestOptions?: RequestOption,
  ): Observable<PageResponse<NotificationLog>> {
    return this.getNotifications(page, size, NotificationStatus.SENT, undefined, requestOptions);
  }

  getUnreadCount(requestOptions?: RequestOption): Observable<number> {
    return this.httpService.get<number>(
      `${Endpoints.NOTIFICATIONS_ENDPOINT}/unread-count`,
      undefined,
      undefined,
      requestOptions ?? { requestType: RequestType.NON_BLOCKING, skipAuthRedirect: true },
    );
  }

  markAsRead(id: number, requestOptions?: RequestOption): Observable<void> {
    return this.httpService.put<void>(
      `${Endpoints.NOTIFICATIONS_ENDPOINT}/${id}/read`,
      null,
      undefined,
      requestOptions ?? { requestType: RequestType.NON_BLOCKING, skipAuthRedirect: true },
    );
  }
}

