import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NotificationsInboxPageComponent } from './notifications-inbox-page.component';
import { NotificationLogService } from '../../services/notification.service';
import { AuthService } from '../../../auth/services/auth.service';

function makeHarness() {
  const mockNotificationService = {
    getInboxNotifications: vi.fn(() => of({ content: [], totalElements: 0, totalPages: 0 })),
    markAsRead: vi.fn(() => of(void 0)),
    markAllAsRead: vi.fn(() => of(void 0)),
  };
  const mockAuthService = { ensureValidSession: vi.fn(() => of(void 0)) };

  TestBed.configureTestingModule({
    imports: [NotificationsInboxPageComponent],
    providers: [
      provideRouter([]),
      { provide: NotificationLogService, useValue: mockNotificationService },
      { provide: AuthService, useValue: mockAuthService },
    ],
  });

  const fixture = TestBed.createComponent(NotificationsInboxPageComponent);
  return { fixture, component: fixture.componentInstance, mockNotificationService };
}

describe('NotificationsInboxPageComponent load', () => {
  it('loads the inbox on init and populates pagination fields', () => {
    const { fixture, component, mockNotificationService } = makeHarness();
    mockNotificationService.getInboxNotifications.mockReturnValue(
      of({ content: [{ id: 1, isRead: false }], totalElements: 1, totalPages: 1 } as any),
    );

    fixture.detectChanges();

    expect(component.notifications).toHaveLength(1);
    expect(component.totalElements).toBe(1);
    expect(component.loading).toBe(false);
  });

  it('surfaces a load error without throwing', () => {
    const { fixture, component, mockNotificationService } = makeHarness();
    mockNotificationService.getInboxNotifications.mockReturnValue(throwError(() => new Error('boom')));

    fixture.detectChanges();

    expect(component.loadError).toBeTruthy();
    expect(component.notifications).toEqual([]);
  });
});

describe('NotificationsInboxPageComponent onNotificationClick', () => {
  it('marks an unread notification as read and navigates using the resolved route', () => {
    const { fixture, component, mockNotificationService } = makeHarness();
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const notification = { id: 5, isRead: false, entityType: 'FOLLOW_UP' } as any;

    component.onNotificationClick(notification);

    expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(5);
    expect(notification.isRead).toBe(true);
    expect(navigateSpy).toHaveBeenCalledWith(['/farm-followups'], undefined);
  });

  it('does not call markAsRead again for an already-read notification', () => {
    const { fixture, component, mockNotificationService } = makeHarness();
    fixture.detectChanges();
    const notification = { id: 6, isRead: true } as any;

    component.onNotificationClick(notification);

    expect(mockNotificationService.markAsRead).not.toHaveBeenCalled();
  });
});

describe('NotificationsInboxPageComponent markAllAsRead', () => {
  it('marks every loaded notification as read', () => {
    const { fixture, component, mockNotificationService } = makeHarness();
    mockNotificationService.getInboxNotifications.mockReturnValue(
      of({
        content: [{ id: 1, isRead: false }, { id: 2, isRead: false }],
        totalElements: 2,
        totalPages: 1,
      } as any),
    );
    fixture.detectChanges();

    component.markAllAsRead();

    expect(mockNotificationService.markAllAsRead).toHaveBeenCalled();
    expect(component.notifications.every((n) => n.isRead)).toBe(true);
  });

  it('hasUnread reflects whether any loaded notification is unread', () => {
    const { fixture, component, mockNotificationService } = makeHarness();
    mockNotificationService.getInboxNotifications.mockReturnValue(
      of({ content: [{ id: 1, isRead: true }], totalElements: 1, totalPages: 1 } as any),
    );
    fixture.detectChanges();

    expect(component.hasUnread()).toBe(false);
  });
});
