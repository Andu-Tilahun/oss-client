import { describe, it, expect, vi } from 'vitest';
import { of } from 'rxjs';
import { FarmPlotsExplorePageComponent } from './farm-plots-explore-page.component';
import { InvestmentPackage } from '../../../investment-package/models/investment-package.model';

function mockPackage(overrides: Partial<InvestmentPackage> = {}): InvestmentPackage {
  return { id: 'pkg-1', title: 'Package', fundingStatus: 'OPEN', ...overrides } as InvestmentPackage;
}

function makeComponent() {
  const mockInvestmentPackageService = {
    filterPublishedInvestmentPackages: vi.fn(() => of({ content: [mockPackage()], totalElements: 1 } as any)),
  };
  const mockFarmPlotService = {};
  const mockRouter = { navigateByUrl: vi.fn() };

  const component = new FarmPlotsExplorePageComponent(
    mockInvestmentPackageService as any,
    mockFarmPlotService as any,
    mockRouter as any,
  );

  return { component, mockInvestmentPackageService };
}

describe('FarmPlotsExplorePageComponent backend-driven pagination', () => {
  it('loadPackages requests OPEN published packages with page/size/sort, not the public unauthenticated method', () => {
    const { component, mockInvestmentPackageService } = makeComponent();

    component.loadPackages();

    expect(mockInvestmentPackageService.filterPublishedInvestmentPackages).toHaveBeenCalledWith(
      expect.objectContaining({
        statuses: ['OPEN'],
        page: 0,
        size: 10,
        sortBy: 'fundingDeadline',
        sortDirection: 'DESC',
      }),
    );
    expect(component.pagedPackages.length).toBe(1);
    expect(component.total).toBe(1);
    expect(component.loadingPackages).toBe(false);
  });

  it('loadPackages never sends a searchText field (search UI removed)', () => {
    const { component, mockInvestmentPackageService } = makeComponent();

    component.loadPackages();

    const request = mockInvestmentPackageService.filterPublishedInvestmentPackages.mock.calls[0][0];
    expect(request).not.toHaveProperty('searchText');
  });

  it('onPageChange applies the new page/size and re-fetches from the backend', () => {
    const { component, mockInvestmentPackageService } = makeComponent();

    component.onPageChange({ pageIndex: 3, pageSize: 20 });

    expect(component.pageIndex).toBe(3);
    expect(component.pageSize).toBe(20);
    expect(mockInvestmentPackageService.filterPublishedInvestmentPackages).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, size: 20 }),
    );
  });

  it('surfaces an empty result set on error instead of leaving stale data', () => {
    const { component, mockInvestmentPackageService } = makeComponent();
    mockInvestmentPackageService.filterPublishedInvestmentPackages.mockReturnValueOnce({
      subscribe: ({ error }: any) => error(new Error('boom')),
    } as any);

    component.loadPackages();

    expect(component.pagedPackages).toEqual([]);
    expect(component.total).toBe(0);
    expect(component.loadingPackages).toBe(false);
  });
});
