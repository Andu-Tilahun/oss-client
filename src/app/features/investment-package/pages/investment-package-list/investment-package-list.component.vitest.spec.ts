import { describe, it, expect, vi } from 'vitest';
import { of } from 'rxjs';
import { InvestmentPackageListComponent } from './investment-package-list.component';
import { InvestmentPackage } from '../../models/investment-package.model';

function mockPackage(overrides: Partial<InvestmentPackage>): InvestmentPackage {
  return {
    id: 'pkg-1',
    farmPlotId: 'plot-1',
    startDate: '2026-01-01',
    endDate: '2026-06-01',
    farmActivity: 'CROPS',
    waterSource: 'RAIN_FED',
    title: 'Package',
    targetAmount: 1000,
    minimumContribution: 1000,
    fundingStatus: 'OPEN' as any,
    farmPlot: {} as any,
    ...overrides,
  } as InvestmentPackage;
}

function makeComponent(opts: { isAdmin?: boolean; isInvestor?: boolean } = {}) {
  const mockInvestmentPackageService = {
    filterPublishedInvestmentPackages: vi.fn(() => of({ content: [], totalElements: 0 } as any)),
    filterArchivedInvestmentPackages: vi.fn(() => of({ content: [], totalElements: 0 } as any)),
  };
  const mockToastService = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
  const mockAuthService = {
    isAdmin: vi.fn(() => opts.isAdmin ?? true),
    isInvestor: vi.fn(() => opts.isInvestor ?? false),
  };

  const component = new InvestmentPackageListComponent(
    mockInvestmentPackageService as any,
    mockToastService as any,
    mockAuthService as any,
  );

  return { component, mockInvestmentPackageService, mockToastService, mockAuthService };
}

describe('InvestmentPackageListComponent stage-gated tabs', () => {
  function tabKeys(component: InvestmentPackageListComponent): string[] {
    return component.tabs.map((t) => t.key);
  }

  it('should create', () => {
    const { component } = makeComponent();
    expect(component).toBeTruthy();
  });

  it('OPEN package with no contract: shows only the base tabs', () => {
    const { component } = makeComponent();

    component.onView(mockPackage({ fundingStatus: 'OPEN' as any }));

    expect(tabKeys(component)).toEqual(['detail', 'farm-plot', 'investor']);
  });

  it('CLOSED, no agreementId yet: adds Contract', () => {
    const { component } = makeComponent();

    component.onView(mockPackage({ fundingStatus: 'CLOSED' as any }));

    expect(tabKeys(component)).toEqual(['detail', 'farm-plot', 'investor', 'contract']);
  });

  it('contract signed, no worker yet: adds Extension Worker with a needs-action badge, keeps Contract', () => {
    const { component } = makeComponent();

    component.onView(mockPackage({ fundingStatus: 'CLOSED' as any, agreementId: 'agr-1', status: 'ACTIVE' }));

    expect(tabKeys(component)).toEqual(['detail', 'farm-plot', 'investor', 'contract', 'extension-worker']);
    expect(component.tabs.find((t) => t.key === 'extension-worker')?.badge).toBe(1);
  });

  it('worker assigned and fundingStatus has moved to FUNDED: Contract and Extension Worker stay visible, FollowUp is added', () => {
    const { component } = makeComponent();

    component.onView(mockPackage({
      fundingStatus: 'FUNDED' as any,
      agreementId: 'agr-1',
      status: 'ACTIVE',
      extensionWorker: { id: 'worker-1' } as any,
      followUpDtoList: [],
    }));

    expect(tabKeys(component)).toEqual(['detail', 'farm-plot', 'investor', 'contract', 'extension-worker', 'follow-up']);
    expect(component.tabs.find((t) => t.key === 'extension-worker')?.badge).toBeUndefined();
    expect(component.tabs.find((t) => t.key === 'follow-up')?.badge).toBe(1);
  });

  it('worker assigned with existing follow-ups: FollowUp has no needs-action badge', () => {
    const { component } = makeComponent();

    component.onView(mockPackage({
      fundingStatus: 'FUNDED' as any,
      agreementId: 'agr-1',
      status: 'ACTIVE',
      extensionWorker: { id: 'worker-1' } as any,
      followUpDtoList: [{ id: 'fu-1' } as any],
    }));

    expect(component.tabs.find((t) => t.key === 'follow-up')?.badge).toBeUndefined();
  });

  it('completed archived package with no "status" field: Extension Worker still shows because a worker is assigned', () => {
    const { component } = makeComponent();

    component.onView(mockPackage({
      fundingStatus: 'FUNDED' as any,
      packageStatus: 'COMPLITED' as any,
      agreementId: 'agr-1',
      status: undefined,
      extensionWorker: { id: 'worker-1' } as any,
      followUpDtoList: [{ id: 'fu-1' } as any],
    }));

    expect(tabKeys(component)).toEqual(['detail', 'farm-plot', 'investor', 'contract', 'extension-worker', 'follow-up']);
  });

  it('funding later force-closed to FAILED after a contract/worker already existed: Contract still shows', () => {
    const { component } = makeComponent();

    component.onView(mockPackage({
      fundingStatus: 'FAILED' as any,
      packageStatus: 'INACTIVE' as any,
      agreementId: 'agr-1',
      status: undefined,
      extensionWorker: { id: 'worker-1' } as any,
      followUpDtoList: [{ id: 'fu-1' }, { id: 'fu-2' }] as any,
    }));

    expect(tabKeys(component)).toEqual(['detail', 'farm-plot', 'investor', 'contract', 'extension-worker', 'follow-up']);
  });
});

describe('InvestmentPackageListComponent mutation refresh handlers', () => {
  it('onAgreementCreated refreshes the current tab and bumps detailRefreshKey', () => {
    const { component, mockInvestmentPackageService } = makeComponent();
    component.onView(mockPackage({}));
    mockInvestmentPackageService.filterPublishedInvestmentPackages.mockClear();
    const keyBefore = component.detailRefreshKey;

    component.onAgreementCreated();

    expect(component.detailRefreshKey).toBe(keyBefore + 1);
    expect(mockInvestmentPackageService.filterPublishedInvestmentPackages).toHaveBeenCalled();
  });

  it('onCandidatesChosen refreshes the current tab and bumps detailRefreshKey', () => {
    const { component, mockInvestmentPackageService } = makeComponent();
    component.onView(mockPackage({}));
    mockInvestmentPackageService.filterPublishedInvestmentPackages.mockClear();
    const keyBefore = component.detailRefreshKey;

    component.onCandidatesChosen();

    expect(component.detailRefreshKey).toBe(keyBefore + 1);
    expect(mockInvestmentPackageService.filterPublishedInvestmentPackages).toHaveBeenCalled();
  });
});
