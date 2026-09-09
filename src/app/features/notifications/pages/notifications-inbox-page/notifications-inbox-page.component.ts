import {Component, OnInit, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {switchMap} from 'rxjs/operators';
import {NotificationLogService} from '../../services/notification.service';
import {NotificationLog} from '../../models/notification.model';
import {AuthService} from '../../../auth/services/auth.service';
import {RequestType} from '../../../../core/services/http.service';
import {
  resolveNotificationRoute,
  formatEventType as formatNotificationEventType,
} from '../../utils/notification-route.util';

@Component({
  selector: 'app-notifications-inbox-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications-inbox-page.component.html',
})
export class NotificationsInboxPageComponent implements OnInit {
  private readonly notificationService = inject(NotificationLogService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  notifications: NotificationLog[] = [];
  loading = false;
  loadError: string | null = null;
  /** 0-based page index for the API */
  pageIndex = 0;
  readonly pageSize = 15;
  totalElements = 0;
  totalPages = 0;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadError = null;
    this.authService.ensureValidSession().pipe(
      switchMap(() => this.notificationService.getInboxNotifications(this.pageIndex, this.pageSize, { requestType: RequestType.LOCAL })),
    ).subscribe({
      next: (res) => {
        this.notifications = res.content ?? [];
        this.totalElements = res.totalElements ?? 0;
        this.totalPages = res.totalPages ?? 0;
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Could not load notifications. Try again later.';
        this.notifications = [];
        this.loading = false;
      },
    });
  }

  prevPage(): void {
    if (this.pageIndex > 0) {
      this.pageIndex--;
      this.load();
    }
  }

  nextPage(): void {
    if (this.pageIndex < this.totalPages - 1) {
      this.pageIndex++;
      this.load();
    }
  }

  formatCreated(n: NotificationLog): string {
    return new Date(n.createdAt).toLocaleString();
  }

  onNotificationClick(notification: NotificationLog): void {
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => { notification.isRead = true; },
      });
    }
    const route = resolveNotificationRoute(notification);
    if (route) {
      void this.router.navigate(route.commands, route.queryParams ? { queryParams: route.queryParams } : undefined);
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach((n) => (n.isRead = true));
      },
    });
  }

  hasUnread(): boolean {
    return this.notifications.some((n) => !n.isRead);
  }

  formatEventType(eventType?: string): string {
    return formatNotificationEventType(eventType);
  }
}
