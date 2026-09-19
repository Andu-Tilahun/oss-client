import { SearchRoute } from '../models/search-result.model';
import { InvestmentPackageStatus } from '../../investment-package/models/investment-package.model';

/**
 * Where each searchable record lives and how to open it. Pages that lack a route-per-record read
 * `?id=` (see `deepLinkId$`); package-backed records also pass `panel` to open a specific tab of
 * the package detail panel.
 */

const ARCHIVED_PACKAGE_STATUSES: InvestmentPackageStatus[] = ['INACTIVE', 'COMPLITED'];

export function userRoute(id: string): SearchRoute {
  return { commands: ['/users', id] };
}

export function paymentRoute(id: string): SearchRoute {
  return { commands: ['/payments', id] };
}

export function farmPlotRoute(id: string): SearchRoute {
  return { commands: ['/farm-plots'], queryParams: { id } };
}

/** Package status decides which list tab (published vs archived) actually contains the record. */
export function investmentPackageRoute(
  packageId: string,
  packageStatus?: InvestmentPackageStatus | null,
  panel?: 'contract' | 'follow-up' | 'investor',
): SearchRoute {
  const queryParams: Record<string, string> = { id: packageId };
  if (packageStatus && ARCHIVED_PACKAGE_STATUSES.includes(packageStatus)) {
    queryParams['tab'] = 'archived';
  }
  if (panel) {
    queryParams['panel'] = panel;
  }
  return { commands: ['/investment-package'], queryParams };
}

export function newsRoute(id: string): SearchRoute {
  return { commands: ['/system-config/news'], queryParams: { id } };
}

export function galleryRoute(id: string): SearchRoute {
  return { commands: ['/system-config/gallery'], queryParams: { id } };
}

export function regionRoute(id: string): SearchRoute {
  return { commands: ['/system-config/regions'], queryParams: { id } };
}

export function templateRoute(id: string, type: 'EMAIL' | 'SMS' | 'CONTRACT'): SearchRoute {
  return { commands: ['/templates', type.toLowerCase()], queryParams: { id } };
}

export function bankAccountRoute(id: string): SearchRoute {
  return { commands: ['/payment-config/bank-accounts'], queryParams: { id } };
}
