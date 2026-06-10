import {Component, OnInit, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {switchMap} from 'rxjs/operators';
import {NotificationLogService} from '../../services/notification.service';
import {NotificationLog} from '../../models/notification.model';
import {AuthService} from '../../../auth/services/auth.service';

@Component({
  selector: 'app-notifications-inbox-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notifications-inbox-page.component.html',
})
export class NotificationsInboxPageComponent implements OnInit {
  private readonly notificationService = inject(NotificationLogService);
  private readonly authService = inject(AuthService);

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
      switchMap(() => this.notificationService.getInboxNotifications(this.pageIndex, this.pageSize)),
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
}
