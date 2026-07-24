import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {CommonModule} from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {switchMap, take} from 'rxjs/operators';
import {NotificationLogService} from '../../../features/notifications/services/notification.service';
import {NotificationLog} from '../../../features/notifications/models/notification.model';
import {AuthService} from '../../../features/auth/services/auth.service';
import {RequestType} from '../../services/http.service';
import {User} from '../../../features/users/models/user.model';
import {FileUploadService} from '../../../shared/file-upload/file-upload.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificationService = inject(NotificationLogService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fileUploadService = inject(FileUploadService);

  private readonly notificationPreviewOptions = {
    requestType: RequestType.NON_BLOCKING,
    skipAuthRedirect: true,
  };

  /** When true, the mobile navigation drawer is open (for aria-expanded). */
  @Input() mobileNavOpen = false;
  @Output() menuToggle = new EventEmitter<void>();

  currentUser: User | null = null;
  showNotificationPanel = false;
  previewItems: NotificationLog[] = [];
  previewTotal = 0;
  previewLoading = false;
  previewError: string | null = null;
  /** Total count from a lightweight request (for badge). */
  badgeTotal: number | null = null;

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.currentUser = user;
        if (user) {
          this.refreshBadgeCount();
        } else {
          this.clearNotificationState();
        }
      });
  }

  toggleMobileNav(): void {
    this.menuToggle.emit();
  }

  toggleNotificationPanel(event: MouseEvent): void {
    event.stopPropagation();
    this.showNotificationPanel = !this.showNotificationPanel;
    if (this.showNotificationPanel && this.authService.isAuthenticated()) {
      this.loadPreview();
    }
  }

  private clearNotificationState(): void {
    this.badgeTotal = null;
    this.previewItems = [];
    this.previewTotal = 0;
    this.previewError = null;
    this.previewLoading = false;
    this.showNotificationPanel = false;
  }

  userAvatar(): string {
    const user = this.currentUser;
    if (user?.profileImageUuid) {
      return this.fileUploadService.getFileUrl(user.profileImageUuid);
    }
    const name = user ? `${user.firstName}+${user.lastName}` : 'User';
    return `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff`;
  }

  editProfile(): void {
    void this.router.navigateByUrl('/profile');
  }

  logout(): void {
    this.authService.logout().subscribe();
  }

  private refreshBadgeCount(): void {
    this.authService.ensureValidSession().pipe(
      switchMap(() => this.notificationService.getUnreadCount(this.notificationPreviewOptions)),
      take(1),
    ).subscribe({
      next: (count) => {
        this.badgeTotal = count ?? 0;
      },
      error: () => {
        this.badgeTotal = null;
      },
    });
  }

  onNotificationClick(notification: NotificationLog): void {
    this.notificationService.markAsRead(notification.id, this.notificationPreviewOptions).subscribe({
      next: () => {
        notification.isRead = true;
        if (this.badgeTotal !== null && this.badgeTotal > 0) {
          this.badgeTotal--;
        }
      },
    });
    this.showNotificationPanel = false;
    const eventData = this.parseEventData(notification.eventData);
    const type = (eventData['investmentPackageType'] as string)?.toLowerCase();
    if (type) {
      void this.router.navigate([`/investment-package-types/${type}`]);
    }
  }

  private parseEventData(raw: string | undefined): Record<string, unknown> {
    if (!raw) return {};
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private loadPreview(): void {
    this.previewLoading = true;
    this.previewError = null;
    this.authService.ensureValidSession().pipe(
      switchMap(() => this.notificationService.getInboxNotifications(0, 5, this.notificationPreviewOptions)),
      take(1),
    ).subscribe({
      next: (res) => {
        this.previewItems = res.content ?? [];
        this.previewTotal = res.totalElements ?? 0;
        this.previewLoading = false;
      },
      error: () => {
        this.previewError = 'Unable to load notifications.';
        this.previewItems = [];
        this.previewLoading = false;
      },
    });
  }

  goToAllNotifications(): void {
    this.showNotificationPanel = false;
    void this.router.navigateByUrl('/notifications-inbox');
  }

  formatPreviewWhen(n: NotificationLog): string {
    return new Date(n.createdAt).toLocaleString();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    if (!this.showNotificationPanel) return;
    if (!this.host.nativeElement.contains(ev.target as Node)) {
      this.showNotificationPanel = false;
    }
  }
}
