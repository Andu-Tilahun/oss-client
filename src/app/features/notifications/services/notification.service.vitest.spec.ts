import { describe, it, expect, vi } from 'vitest';
import { of } from 'rxjs';
import { NotificationLogService } from './notification.service';
import { Endpoints } from '../../../core/endpoint/endpoint.model';

function makeService() {
  const mockHttpService = {
    get: vi.fn(() => of({ content: [], totalElements: 0 } as any)),
    put: vi.fn(() => of(void 0)),
  };
  const service = new NotificationLogService(mockHttpService as any);
  return { service, mockHttpService };
}

describe('NotificationLogService getInboxNotifications', () => {
  it('hits the my-inbox endpoint, not the admin-unscoped notifications endpoint', () => {
    const { service, mockHttpService } = makeService();

    service.getInboxNotifications(0, 10).subscribe();

    expect(mockHttpService.get).toHaveBeenCalledWith(
      `${Endpoints.NOTIFICATIONS_ENDPOINT}/my-inbox`,
      undefined,
      expect.anything(),
      undefined,
    );
  });
});

describe('NotificationLogService markAllAsRead', () => {
  it('calls PUT read-all and resets the shared unread count to zero', () => {
    const { service, mockHttpService } = makeService();
    let latestCount: number | undefined;
    service.unreadCount$.subscribe((count) => (latestCount = count));
    (service as any)['unreadCountSubject'].next(7);

    service.markAllAsRead().subscribe();

    expect(mockHttpService.put).toHaveBeenCalledWith(
      `${Endpoints.NOTIFICATIONS_ENDPOINT}/read-all`,
      null,
      undefined,
      expect.anything(),
    );
    expect(latestCount).toBe(0);
  });
});
