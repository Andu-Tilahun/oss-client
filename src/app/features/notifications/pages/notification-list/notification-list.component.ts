import { Component, OnInit } from '@angular/core';
import { NotificationLogService } from '../../services/notification.service';
import { NotificationLog } from '../../models/notification.model';
import { DataTableColumn } from '../../../../shared/data-table/models/data-table-column.model';
import { TableQueryParams } from '../../../../shared/data-table/models/table-query-params.model';
import { PageResponse } from '../../../../shared/models/api-response.model';
import {ToastService} from "../../../../shared/toast/toast.service";

@Component({
  selector: 'app-notification-list',
  standalone: false,
  templateUrl: './notification-list.component.html'
})
export class NotificationListComponent implements OnInit {
  notifications: NotificationLog[] = [];
  selectedNotification: NotificationLog | null = null;
  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  searchText = '';
  status = '';
  priority = '';

  columns: DataTableColumn<NotificationLog>[] = [
    { header: 'Type', value: n => n.notificationType },
    { header: 'Recipient', value: n => n.recipient },
    { header: 'Subject', value: n => n.subject || '-' },
    { header: 'Status', value: n => n.status },
    { header: 'Created At', value: n => new Date(n.createdAt).toLocaleString() }
  ];

  constructor(
    private notificationService: NotificationLogService,
    private toastService: ToastService
  ) {}

  onView(notification: NotificationLog): void {
    this.selectedNotification = { ...notification };
  }

  onCloseDetail(): void {
    this.selectedNotification = null;
  }

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    this.loading = true;
    this.notificationService.getNotifications(
      this.pageIndex - 1,
      this.pageSize,
      this.status || undefined,
      this.priority || undefined
    ).subscribe({
      next: (response: PageResponse<NotificationLog>) => {
        if (response) {
          this.toastService.success(`Notification retrieved successfully`);
          this.notifications = response.content;
          this.total = response.totalElements;
          const previousSelectedId = this.selectedNotification?.id;

          if (this.notifications.length === 0) {
            this.selectedNotification = null;
          } else if (!previousSelectedId) {
            this.selectedNotification = { ...this.notifications[0] };
          } else {
            const match = this.notifications.find((n) => n.id === previousSelectedId);
            this.selectedNotification = match ? { ...match } : { ...this.notifications[0] };
          }
        }
        this.loading = false;
      },
      error: (error) => {
        this.toastService.error(
          error.message || 'Failed to fetch notifications',
          'Fetch Audits'
        );
        this.loading = false;
      }
    });
  }

  onPageChange(params: TableQueryParams): void {
    this.pageIndex = params.pageIndex;
    this.pageSize = params.pageSize;
    this.loadNotifications();
  }

  onSearch(): void {
    this.pageIndex = 1;
    this.loadNotifications();
  }

  clearFilters(): void {
    this.searchText = '';
    this.status = '';
    this.priority = '';
    this.pageIndex = 1;
    this.loadNotifications();
  }
}

