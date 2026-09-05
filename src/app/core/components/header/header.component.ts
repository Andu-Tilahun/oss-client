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
import {Subscription, interval} from 'rxjs';
import {switchMap, take} from 'rxjs/operators';
import {NotificationLogService} from '../../../features/notifications/services/notification.service';
import {NotificationLog} from '../../../features/notifications/models/notification.model';
import {AuthService} from '../../../features/auth/services/auth.service';
import {RequestType} from '../../services/http.service';
import {User} from '../../../features/users/models/user.model';
import {FileUploadService} from '../../../shared/file-upload/file-upload.service';
import {SystemConfigService} from '../../../features/system-config/services/system-config.service';

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
  private readonly systemConfigService = inject(SystemConfigService);

  private readonly notificationPreviewOptions = {
    requestType: RequestType.NON_BLOCKING,
    skipAuthRedirect: true,
  };
  private static readonly UNREAD_POLL_INTERVAL_MS = 30000;
  private pollSubscription?: Subscription;

  /** When true, the mobile navigation drawer is open (for aria-expanded). */
  @Input() mobileNavOpen = false;
  @Output() menuToggle = new EventEmitter<void>();

  currentUser: User | null = null;
  orgName = 'AgriVest';
  orgLogoUrl: string | null = null;
  showNotificationPanel = false;
  previewItems: NotificationLog[] = [];
  previewTotal = 0;
  previewLoading = false;
  previewError: string | null = null;
  /** Total count from a lightweight request (for badge). */
  badgeTotal = 0;

  ngOnInit(): void {
    this.notificationService.unreadCount$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((count) => {
        this.badgeTotal = count;
      });

    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => {
        this.currentUser = user;
        if (user) {
          this.refreshBadgeCount();
          this.loadOrgBranding();
          this.startUnreadPolling();
        } else {
          this.clearNotificationState();
          this.stopUnreadPolling();
        }
      });
  }

  private startUnreadPolling(): void {
    this.stopUnreadPolling();
    this.pollSubscription = interval(HeaderComponent.UNREAD_POLL_INTERVAL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshBadgeCount());
  }

  private stopUnreadPolling(): void {
    this.pollSubscription?.unsubscribe();
    this.pollSubscription = undefined;
  }

  private loadOrgBranding(): void {
    this.systemConfigService.getOrganizationConfig()
      .pipe(take(1))
      .subscribe({
        next: (config) => {
          this.orgName = config.name || 'AgriVest';
          this.orgLogoUrl = config.logoUuid
            ? this.fileUploadService.getFileUrl(config.logoUuid)
            : null;
        },
        error: () => {},
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
    this.notificationService.clearUnreadCount();
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
      switchMap(() => this.notificationService.refreshUnreadCount(this.notificationPreviewOptions)),
      take(1),
    ).subscribe({ error: () => {} });
  }

  onNotificationClick(notification: NotificationLog): void {
    this.notificationService.markAsRead(notification.id, this.notificationPreviewOptions).subscribe({
      next: () => {
        notification.isRead = true;
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
