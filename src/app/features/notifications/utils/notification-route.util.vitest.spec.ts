import { describe, it, expect } from 'vitest';
import { resolveNotificationRoute, formatEventType } from './notification-route.util';
import { NotificationLog } from '../models/notification.model';

function mockNotification(overrides: Partial<NotificationLog>): NotificationLog {
  return {
    id: 1,
    notificationType: 'EMAIL',
    recipient: 'user@example.com',
    status: 'SENT',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as NotificationLog;
}

describe('resolveNotificationRoute', () => {
  it('deep-links to the specific package type page when entityType and investmentPackageType are known', () => {
    const route = resolveNotificationRoute(
      mockNotification({ entityType: 'INVESTMENT_PACKAGE', investmentPackageType: 'LEASING', entityId: '42' }),
    );

    expect(route).toEqual({
      commands: ['/investment-package-types', 'leasing'],
      queryParams: { packageId: '42' },
    });
  });

  it('falls back to the unified list with ?id= for INVESTMENT_PACKAGE without a known type', () => {
    const route = resolveNotificationRoute(
      mockNotification({ entityType: 'INVESTMENT_PACKAGE', entityId: '42' }),
    );

    expect(route).toEqual({ commands: ['/investment-package'], queryParams: { id: '42' } });
  });

  it('falls back to the unified list with ?id= for AGREEMENT', () => {
    const route = resolveNotificationRoute(
      mockNotification({ entityType: 'AGREEMENT', entityId: '99' }),
    );

    expect(route).toEqual({ commands: ['/investment-package'], queryParams: { id: '99' } });
  });

  it('opens the follow-ups list with no row selection for FOLLOW_UP', () => {
    const route = resolveNotificationRoute(
      mockNotification({ entityType: 'FOLLOW_UP', entityId: '5' }),
    );

    expect(route).toEqual({ commands: ['/farm-followups'] });
  });

  it('returns null when no entityType is known', () => {
    const route = resolveNotificationRoute(mockNotification({}));

    expect(route).toBeNull();
  });

  it('falls back to the unified list without a query param when entityId is missing', () => {
    const route = resolveNotificationRoute(
      mockNotification({ entityType: 'INVESTMENT_PACKAGE', investmentPackageType: 'LEASING' }),
    );

    expect(route).toEqual({ commands: ['/investment-package'], queryParams: undefined });
  });
});

describe('formatEventType', () => {
  it('humanizes an upper-snake-case event type', () => {
    expect(formatEventType('FARM_INVESTMENT_AGREEMENT_APPROVED')).toBe('Farm Investment Agreement Approved');
  });

  it('returns an empty string for undefined input', () => {
    expect(formatEventType(undefined)).toBe('');
  });
});
