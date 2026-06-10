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
import {filter, switchMap, take} from 'rxjs/operators';
import {NotificationLogService} from '../../../features/notifications/services/notification.service';
import {NotificationLog} from '../../../features/notifications/models/notification.model';
import {AuthService} from '../../../features/auth/services/auth.service';
import {RequestType} from '../../services/http.service';

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

  private readonly notificationPreviewOptions = {
    requestType: RequestType.NON_BLOCKING,
    skipAuthRedirect: true,
  };

  /** When true, the mobile navigation drawer is open (for aria-expanded). */
  @Input() mobileNavOpen = false;
  @Output() menuToggle = new EventEmitter<void>();

  showNotificationPanel = false;
  previewItems: NotificationLog[] = [];
  previewTotal = 0;
  previewLoading = false;
  previewError: string | null = null;
  /** Total count from a lightweight request (for badge). */
  badgeTotal: number | null = null;

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(
        filter((user) => !!user),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.refreshBadgeCount();
      });

    this.authService.currentUser$
      .pipe(
        filter((user) => !user),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.clearNotificationState();
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

  private refreshBadgeCount(): void {
    this.authService.ensureValidSession().pipe(
      switchMap(() => this.notificationService.getInboxNotifications(0, 1, this.notificationPreviewOptions)),
      take(1),
    ).subscribe({
      next: (res) => {
        this.badgeTotal = res.totalElements ?? 0;
      },
      error: () => {
        this.badgeTotal = null;
      },
    });
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
        this.badgeTotal = this.previewTotal;
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
    if (!this.showNotificationPanel) {
      return;
    }
    if (!this.host.nativeElement.contains(ev.target as Node)) {
      this.showNotificationPanel = false;
    }
  }
}
