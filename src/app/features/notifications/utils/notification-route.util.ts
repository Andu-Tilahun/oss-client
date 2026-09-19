import { NotificationLog } from '../models/notification.model';

export interface NotificationRoute {
  commands: any[];
  queryParams?: Record<string, string>;
}

/**
 * Resolves where a notification click should navigate.
 * Only INVESTMENT_PACKAGE notifications with a known package type get a precise
 * deep link (mirrors the ?packageId= mechanism on investment-package-type-list).
 * AGREEMENT/generic INVESTMENT_PACKAGE fall back to the unified list with ?id=;
 * FOLLOW_UP opens the follow-ups list with no row auto-select.
 */
export function resolveNotificationRoute(notification: NotificationLog): NotificationRoute | null {
  if (notification.entityType === 'INVESTMENT_PACKAGE' && notification.investmentPackageType && notification.entityId) {
    return {
      commands: ['/investment-package-types', notification.investmentPackageType.toLowerCase()],
      queryParams: { packageId: notification.entityId },
    };
  }
  if (notification.entityType === 'INVESTMENT_PACKAGE' || notification.entityType === 'AGREEMENT') {
    return {
      commands: ['/investment-package'],
      queryParams: notification.entityId ? { id: notification.entityId } : undefined,
    };
  }
  if (notification.entityType === 'FOLLOW_UP') {
    return { commands: ['/farm-followups'] };
  }
  return null;
}

/** "FARM_INVESTMENT_AGREEMENT_APPROVED" -> "Farm Investment Agreement Approved" */
export function formatEventType(eventType?: string): string {
  if (!eventType) return '';
  return eventType
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
