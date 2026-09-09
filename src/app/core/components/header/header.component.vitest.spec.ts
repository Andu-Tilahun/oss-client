import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { HeaderComponent } from './header.component';
import { NotificationLogService } from '../../../features/notifications/services/notification.service';
import { AuthService } from '../../../features/auth/services/auth.service';
import { FileUploadService } from '../../../shared/file-upload/file-upload.service';
import { SystemConfigService } from '../../../features/system-config/services/system-config.service';

function makeHarness(loggedIn = true) {
  const currentUser$ = new BehaviorSubject<any>(loggedIn ? { id: 'u1', firstName: 'A', lastName: 'B' } : null);
  const unreadCountSubject = new BehaviorSubject<number>(0);

  const mockNotificationService = {
    unreadCount$: unreadCountSubject.asObservable(),
    refreshUnreadCount: vi.fn(() => {
      unreadCountSubject.next(3);
      return of(3);
    }),
    clearUnreadCount: vi.fn(() => unreadCountSubject.next(0)),
    markAsRead: vi.fn(() => of(void 0)),
    markAllAsRead: vi.fn(() => of(void 0)),
    getInboxNotifications: vi.fn(() => of({ content: [], totalElements: 0 })),
  };
  const mockAuthService = {
    currentUser$,
    isAuthenticated: vi.fn(() => loggedIn),
    ensureValidSession: vi.fn(() => of(void 0)),
  };
  const mockFileUploadService = { getFileUrl: vi.fn((id: string) => `https://files/${id}`) };
  const mockSystemConfigService = { getOrganizationConfig: vi.fn(() => of({ name: 'AgriVest', logoUuid: null })) };

  TestBed.configureTestingModule({
    imports: [HeaderComponent],
    providers: [
      provideRouter([]),
      { provide: NotificationLogService, useValue: mockNotificationService },
      { provide: AuthService, useValue: mockAuthService },
      { provide: FileUploadService, useValue: mockFileUploadService },
      { provide: SystemConfigService, useValue: mockSystemConfigService },
    ],
  });

  const fixture = TestBed.createComponent(HeaderComponent);
  return { fixture, component: fixture.componentInstance, mockNotificationService, currentUser$, unreadCountSubject };
}

describe('HeaderComponent notification badge', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('badgeTotal reflects the shared unreadCount$ stream', () => {
    const { fixture, component, unreadCountSubject } = makeHarness();
    fixture.detectChanges();

    unreadCountSubject.next(5);
    expect(component.badgeTotal).toBe(5);

    unreadCountSubject.next(0);
    expect(component.badgeTotal).toBe(0);
  });

  it('refreshes the unread count on init when a user is logged in', () => {
    const { fixture, mockNotificationService } = makeHarness(true);
    fixture.detectChanges();

    expect(mockNotificationService.refreshUnreadCount).toHaveBeenCalled();
  });

  it('polls for new notifications on an interval while logged in', () => {
    vi.useFakeTimers();
    const { fixture, mockNotificationService } = makeHarness(true);
    fixture.detectChanges();

    const callsAfterInit = mockNotificationService.refreshUnreadCount.mock.calls.length;
    vi.advanceTimersByTime(30000);
    expect(mockNotificationService.refreshUnreadCount.mock.calls.length).toBeGreaterThan(callsAfterInit);
  });

  it('stops polling and clears the badge on logout', () => {
    vi.useFakeTimers();
    const { fixture, component, currentUser$, mockNotificationService } = makeHarness(true);
    fixture.detectChanges();

    currentUser$.next(null);
    expect(mockNotificationService.clearUnreadCount).toHaveBeenCalled();
    expect(component.badgeTotal).toBe(0);

    const callsAfterLogout = mockNotificationService.refreshUnreadCount.mock.calls.length;
    vi.advanceTimersByTime(60000);
    expect(mockNotificationService.refreshUnreadCount.mock.calls.length).toBe(callsAfterLogout);
  });

  it('onNotificationClick marks the notification read and syncs the shared count via the service', () => {
    const { fixture, component, mockNotificationService } = makeHarness();
    fixture.detectChanges();
    const notification = { id: 42, isRead: false, eventData: undefined } as any;

    component.onNotificationClick(notification);

    expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(42, expect.anything());
    expect(notification.isRead).toBe(true);
  });

  it('onNotificationClick navigates to the resolved route for a known entity type', () => {
    const { fixture, component } = makeHarness();
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const notification = { id: 7, isRead: false, entityType: 'FOLLOW_UP' } as any;

    component.onNotificationClick(notification);

    expect(navigateSpy).toHaveBeenCalledWith(['/farm-followups'], undefined);
  });

  it('onNotificationClick does not navigate when the entity type is unresolvable', () => {
    const { fixture, component } = makeHarness();
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const notification = { id: 8, isRead: false } as any;

    component.onNotificationClick(notification);

    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('markAllAsRead calls the service and marks all preview items read locally', () => {
    const { fixture, component, mockNotificationService } = makeHarness();
    fixture.detectChanges();
    component.previewItems = [
      { id: 1, isRead: false } as any,
      { id: 2, isRead: false } as any,
    ];

    component.markAllAsRead();

    expect(mockNotificationService.markAllAsRead).toHaveBeenCalled();
    expect(component.previewItems.every((n) => n.isRead)).toBe(true);
  });

  it('formatEventType humanizes the raw event type for display', () => {
    const { fixture, component } = makeHarness();
    fixture.detectChanges();

    expect(component.formatEventType('FARM_INVESTMENT_AGREEMENT_APPROVED')).toBe('Farm Investment Agreement Approved');
  });

  it('bell icon turns red and animates while there are unread notifications', () => {
    const { fixture, unreadCountSubject } = makeHarness();
    fixture.detectChanges();
    const bell = fixture.nativeElement.querySelector('button[aria-label="Notifications"] svg');

    unreadCountSubject.next(0);
    fixture.detectChanges();
    expect(bell.classList.contains('notification-bell--unread')).toBe(false);

    unreadCountSubject.next(3);
    fixture.detectChanges();
    expect(bell.classList.contains('notification-bell--unread')).toBe(true);

    unreadCountSubject.next(0);
    fixture.detectChanges();
    expect(bell.classList.contains('notification-bell--unread')).toBe(false);
  });
});

describe('HeaderComponent userAvatar', () => {
  it('uses the pre-authorized profileUrl rather than building a raw file URL', () => {
    const { fixture, component, currentUser$ } = makeHarness();
    fixture.detectChanges();
    currentUser$.next({ id: 'u1', firstName: 'A', lastName: 'B', profileUrl: 'https://storage/presigned' } as any);

    expect(component.userAvatar()).toBe('https://storage/presigned');
  });

  it('falls back to a generated avatar when profileUrl is absent (e.g. redacted for this viewer)', () => {
    const { fixture, component, currentUser$ } = makeHarness();
    fixture.detectChanges();
    currentUser$.next({ id: 'u1', firstName: 'A', lastName: 'B' } as any);

    expect(component.userAvatar()).toContain('ui-avatars.com');
  });
});
