import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { FarmPlotViewComponent } from './farm-plot-view.component';
import { FarmPlot } from '../../models/farm-plot.model';
import { InvestmentPackage } from '../../../investment-package/models/investment-package.model';

function mockPlot(overrides: Partial<FarmPlot>): FarmPlot {
  return { id: 'plot-1', title: 'North Field', size: 10, sizeType: 'ACRES', soilType: 'LOAMY', status: 'ACTIVE', ...overrides };
}

function mockPackage(overrides: Partial<InvestmentPackage>): InvestmentPackage {
  return { id: 'pkg-1', title: 'Package', farmPlotId: 'plot-1', ...overrides } as InvestmentPackage;
}

function makeComponent(opts: { isAdmin?: boolean; isInvestor?: boolean; packages?: InvestmentPackage[] } = {}) {
  const mockFarmPlotService = {
    getFarmPlotGallery: vi.fn(() => of([])),
  };
  const mockToastService = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
  const mockInvestmentPackageService = {
    filterInvestmentPackages: vi.fn(() => of({ content: opts.packages ?? [] } as any)),
  };
  const mockRouter = { navigate: vi.fn() };
  const mockAuthService = {
    isAdmin: vi.fn(() => opts.isAdmin ?? true),
    isInvestor: vi.fn(() => opts.isInvestor ?? false),
  };

  const component = new FarmPlotViewComponent(
    mockFarmPlotService as any,
    mockToastService as any,
    mockInvestmentPackageService as any,
    mockRouter as any,
    mockAuthService as any,
  );

  return { component, mockFarmPlotService, mockInvestmentPackageService, mockAuthService, mockRouter };
}

describe('FarmPlotViewComponent tabs', () => {
  let component: FarmPlotViewComponent;

  it('should create', () => {
    ({ component } = makeComponent());
    expect(component).toBeTruthy();
  });

  it('includes description, investment-history, and actions tabs for an admin viewing an ACTIVE plot', () => {
    ({ component } = makeComponent({ isAdmin: true }));
    component.plot = mockPlot({ status: 'ACTIVE' });

    component.ngOnChanges({ plot: {} as any });

    expect(component.tabs.map((t) => t.key)).toEqual(['description', 'investment-history', 'actions']);
    expect(component.activeTab).toBe('description');
  });

  it('omits the actions tab for a plot that is not ACTIVE or UNDER_MAINTENANCE', () => {
    ({ component } = makeComponent({ isAdmin: true }));
    component.plot = mockPlot({ status: 'INACTIVE' });

    component.ngOnChanges({ plot: {} as any });

    expect(component.tabs.map((t) => t.key)).toEqual(['description', 'investment-history']);
  });

  it('omits the actions tab for a non-admin viewer', () => {
    ({ component } = makeComponent({ isAdmin: false }));
    component.plot = mockPlot({ status: 'ACTIVE' });

    component.ngOnChanges({ plot: {} as any });

    expect(component.tabs.map((t) => t.key)).toEqual(['description', 'investment-history']);
  });

  it('shows only the description tab for an investor, regardless of plot status', () => {
    ({ component } = makeComponent({ isAdmin: false, isInvestor: true }));
    component.plot = mockPlot({ status: 'ACTIVE' });

    component.ngOnChanges({ plot: {} as any });

    expect(component.tabs.map((t) => t.key)).toEqual(['description']);
  });

  it('never fetches investment packages for an investor', () => {
    const { component: c, mockInvestmentPackageService } = makeComponent({ isInvestor: true });
    c.plot = mockPlot({});

    c.ngOnChanges({ plot: {} as any });

    expect(mockInvestmentPackageService.filterInvestmentPackages).not.toHaveBeenCalled();
    expect(c.plotInvestmentPackages).toEqual([]);
  });

  it('shows a badge on the investment-history tab once packages load, and no badge when there are none', () => {
    ({ component } = makeComponent({ packages: [mockPackage({}), mockPackage({ id: 'pkg-2' })] }));
    component.plot = mockPlot({});

    component.ngOnChanges({ plot: {} as any });

    const historyTab = component.tabs.find((t) => t.key === 'investment-history');
    expect(historyTab?.badge).toBe(2);
  });

  it('resets to the description tab when a different plot is selected', () => {
    ({ component } = makeComponent());
    component.plot = mockPlot({ id: 'plot-1' });
    component.ngOnChanges({ plot: {} as any });
    component.activeTab = 'actions';

    component.plot = mockPlot({ id: 'plot-2' });
    component.ngOnChanges({ plot: {} as any });

    expect(component.activeTab).toBe('description');
  });

  it('keeps the current tab when the same plot is refreshed (e.g. after a status-changing action)', () => {
    ({ component } = makeComponent());
    component.plot = mockPlot({ id: 'plot-1', status: 'ACTIVE' });
    component.ngOnChanges({ plot: {} as any });
    component.activeTab = 'actions';

    // Same id, fresh object reference (as the parent would pass after a refresh).
    component.plot = mockPlot({ id: 'plot-1', status: 'ACTIVE' });
    component.ngOnChanges({ plot: {} as any });

    expect(component.activeTab).toBe('actions');
  });

  it('falls back to description if the active tab no longer exists after a refresh (e.g. plot just got archived)', () => {
    ({ component } = makeComponent());
    component.plot = mockPlot({ id: 'plot-1', status: 'ACTIVE' });
    component.ngOnChanges({ plot: {} as any });
    component.activeTab = 'actions';

    // Same id, but status changed such that the actions tab no longer applies.
    component.plot = mockPlot({ id: 'plot-1', status: 'INACTIVE' });
    component.ngOnChanges({ plot: {} as any });

    expect(component.activeTab).toBe('description');
  });

  describe('plotInvestmentPackages sort order (timeline)', () => {
    it('orders packages by funding deadline, soonest/most-recent first', () => {
      ({ component } = makeComponent({
        packages: [
          mockPackage({ id: 'pkg-old', fundingDeadline: '2025-01-01T00:00:00Z' }),
          mockPackage({ id: 'pkg-new', fundingDeadline: '2027-06-01T00:00:00Z' }),
          mockPackage({ id: 'pkg-mid', fundingDeadline: '2026-03-01T00:00:00Z' }),
        ],
      }));
      component.plot = mockPlot({});

      component.ngOnChanges({ plot: {} as any });

      expect(component.plotInvestmentPackages.map((p) => p.id)).toEqual(['pkg-new', 'pkg-mid', 'pkg-old']);
    });

    it('sorts entries with no funding deadline to the end', () => {
      ({ component } = makeComponent({
        packages: [
          mockPackage({ id: 'pkg-none', fundingDeadline: undefined }),
          mockPackage({ id: 'pkg-dated', fundingDeadline: '2026-03-01T00:00:00Z' }),
        ],
      }));
      component.plot = mockPlot({});

      component.ngOnChanges({ plot: {} as any });

      expect(component.plotInvestmentPackages.map((p) => p.id)).toEqual(['pkg-dated', 'pkg-none']);
    });
  });

  describe('onTabChange', () => {
    it('updates activeTab', () => {
      ({ component } = makeComponent());
      component.onTabChange('investment-history');
      expect(component.activeTab).toBe('investment-history');
    });
  });
});
