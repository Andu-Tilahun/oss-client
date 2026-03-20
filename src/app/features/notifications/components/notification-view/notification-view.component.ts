import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationLog } from '../../models/notification.model';
import { NotificationLogService } from '../../services/notification.service';
import { DetailCardComponent } from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import { DetailSectionComponent } from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import { DetailFieldComponent } from '../../../../shared/components/detail-field/detail-field/detail-field.component';

@Component({
  selector: 'app-notification-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './notification-view.component.html',
})
export class NotificationViewComponent implements OnInit {
  @Input() id?: number;

  notification: NotificationLog | null = null;
  loading = false;
  error: string | null = null;

  constructor(private notificationService: NotificationLogService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (this.id == null) return;
    this.loading = true;
    this.error = null;
    this.notificationService.getNotificationById(this.id).subscribe({
      next: (n) => {
        this.notification = n;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load notification';
        this.notification = null;
        this.loading = false;
      },
    });
  }
}
