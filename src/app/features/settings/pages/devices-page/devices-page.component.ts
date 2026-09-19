import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/services/auth.service';
import { UserSession } from '../../../users/models/user.model';
import { ToastService } from '../../../../shared/toast/toast.service';
import { ConfirmationModalComponent, ConfirmationType } from '../../../../shared/modals/confirmation-modal/confirmation-modal.component';

@Component({
  selector: 'app-devices-page',
  standalone: true,
  imports: [CommonModule, ConfirmationModalComponent],
  templateUrl: './devices-page.component.html',
})
export class DevicesPageComponent implements OnInit {
  sessions: UserSession[] = [];
  loading = true;
  loadFailed = false;
  terminatingId: string | null = null;

  /** The session the user is being asked to end; drives the confirmation modal. */
  sessionToEnd: UserSession | null = null;
  showConfirm = false;

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.loadFailed = false;
    this.authService.getSessions().subscribe({
      next: (sessions) => {
        this.sessions = sessions ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadFailed = true;
      },
    });
  }

  /** Signed in and not yet expired — the ones the user can still act on. This device is listed first. */
  get activeSessions(): UserSession[] {
    return this.sessions
      .filter((s) => this.isActive(s))
      .sort((a, b) => Number(b.current) - Number(a.current));
  }

  /** Everything that has ended: signed out / terminated, or simply expired. */
  get recentLogins(): UserSession[] {
    return this.sessions.filter((s) => !this.isActive(s));
  }

  isActive(session: UserSession): boolean {
    return !session.revoked && new Date(session.expiresAt).getTime() > Date.now();
  }

  statusLabel(session: UserSession): string {
    return session.revoked ? 'Signed out' : 'Expired';
  }

  isMobileDevice(session: UserSession): boolean {
    return /iphone|ipad|android/i.test(session.deviceLabel ?? '');
  }

  /** Opens the confirmation modal; nothing is ended until the user confirms there. */
  askToEnd(session: UserSession): void {
    if (this.terminatingId) {
      return; // a request is already in flight
    }
    this.sessionToEnd = session;
    this.showConfirm = true;
  }

  get confirmTitle(): string {
    return this.sessionToEnd?.current ? 'Sign out of this device?' : 'End this session?';
  }

  get confirmMessage(): string {
    const session = this.sessionToEnd;
    if (!session) {
      return '';
    }
    if (session.current) {
      return "This is the device you're using right now. Ending its session will sign you out and return you to the public site.";
    }
    const device = session.deviceLabel || 'This device';
    const ip = session.ipAddress ? ` (IP ${session.ipAddress})` : '';
    return `${device}${ip} will be signed out and asked to log in again the next time it contacts the server.`;
  }

  get confirmText(): string {
    return this.sessionToEnd?.current ? 'Sign out' : 'End session';
  }

  get confirmType(): ConfirmationType {
    return this.sessionToEnd?.current ? 'warning' : 'danger';
  }

  confirmEnd(): void {
    const session = this.sessionToEnd;
    if (!session || this.terminatingId) {
      return;
    }

    this.terminatingId = session.sessionId;
    this.authService.terminateSession(session.sessionId).subscribe({
      next: () => {
        this.terminatingId = null;
        this.showConfirm = false;
        if (session.current) {
          this.authService.forceLogout();
          return;
        }
        this.toastService.success('Session ended');
        this.load();
      },
      error: () => {
        // HttpService already surfaced the error; just release the modal.
        this.terminatingId = null;
        this.showConfirm = false;
      },
    });
  }

  trackBySessionId(_index: number, session: UserSession): string {
    return session.sessionId;
  }
}
