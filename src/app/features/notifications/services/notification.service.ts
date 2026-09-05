import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { HttpService, RequestOption, RequestType } from '../../../core/services/http.service';
import { Endpoints } from '../../../core/endpoint/endpoint.model';
import { PageResponse } from '../../../shared/models/api-response.model';
import {
  NotificationLog,
  NotificationPriorityValue,
  NotificationStats,
  NotificationStatus,
  NotificationStatusValue,
} from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationLogService {

  private readonly unreadCountSubject = new BehaviorSubject<number>(0);
  /** Shared unread count — every component reads from this so they all stay in sync
   *  the moment any one of them marks a notification read or refreshes the count. */
  readonly unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private httpService: HttpService) {
  }

  /** Re-fetches the unread count from the backend and pushes it into the shared stream. */
  refreshUnreadCount(requestOptions?: RequestOption): Observable<number> {
    return this.getUnreadCount(requestOptions).pipe(
      tap((count) => this.unreadCountSubject.next(count ?? 0)),
    );
  }

  /** Resets the shared unread count locally (e.g. on logout) without a network call. */
  clearUnreadCount(): void {
    this.unreadCountSubject.next(0);
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

  getStats(requestOptions?: RequestOption): Observable<NotificationStats> {
    return this.httpService.get<NotificationStats>(
      `${Endpoints.NOTIFICATIONS_ENDPOINT}/stats`,
      undefined,
      undefined,
      requestOptions,
    );
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
    ).pipe(
      tap(() => this.refreshUnreadCount(requestOptions).subscribe()),
    );
  }
}

