import { describe, it, expect, vi, afterEach } from 'vitest';
import { convertToParamMap, ParamMap } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
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
    getInvestmentPackageById: vi.fn(),
  };
  const mockToastService = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
  const mockAuthService = {
    isAdmin: vi.fn(() => opts.isAdmin ?? true),
    isInvestor: vi.fn(() => opts.isInvestor ?? false),
  };
  const queryParams$ = new BehaviorSubject<ParamMap>(convertToParamMap({}));
  const mockActivatedRoute = {
    get snapshot() { return { queryParamMap: queryParams$.value }; },
    queryParamMap: queryParams$.asObservable(),
  };
  const setQueryParams = (params: Record<string, string>) => queryParams$.next(convertToParamMap(params));

  const component = new InvestmentPackageListComponent(
    mockInvestmentPackageService as any,
    mockToastService as any,
    mockAuthService as any,
    mockActivatedRoute as any,
  );

  return { component, mockInvestmentPackageService, mockToastService, mockAuthService, mockActivatedRoute, setQueryParams };
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

describe('InvestmentPackageListComponent deep-link (?id=)', () => {
  afterEach(() => vi.useRealTimers());

  it('selects the deep-linked package when it is on the loaded page', () => {
    const { component, mockInvestmentPackageService, setQueryParams } = makeComponent();
    const pkg = mockPackage({ id: 'pkg-1', packageStatus: 'ACTIVE' });
    mockInvestmentPackageService.getInvestmentPackageById.mockReturnValue(of(pkg));
    mockInvestmentPackageService.filterPublishedInvestmentPackages.mockReturnValue(
      of({ content: [pkg], totalElements: 1 } as any),
    );
    setQueryParams({ id: 'pkg-1' });

    component.ngOnInit();

    expect(mockInvestmentPackageService.getInvestmentPackageById).toHaveBeenCalledWith('pkg-1');
    expect(component.selectedInvestmentPackage?.id).toBe('pkg-1');
  });

  it('selects the fetched package even when it is NOT on the first loaded page', () => {
    const { component, mockInvestmentPackageService, setQueryParams } = makeComponent();
    mockInvestmentPackageService.getInvestmentPackageById.mockReturnValue(
      of(mockPackage({ id: 'old-pkg', packageStatus: 'ACTIVE' })),
    );
    mockInvestmentPackageService.filterPublishedInvestmentPackages.mockReturnValue(
      of({ content: [mockPackage({ id: 'other' })], totalElements: 30 } as any),
    );
    setQueryParams({ id: 'old-pkg' });

    component.ngOnInit();

    expect(component.selectedInvestmentPackage?.id).toBe('old-pkg');
  });

  it('switches to the archived tab when the package status is archived', () => {
    const { component, mockInvestmentPackageService, setQueryParams } = makeComponent();
    mockInvestmentPackageService.getInvestmentPackageById.mockReturnValue(
      of(mockPackage({ id: 'pkg-9', packageStatus: 'COMPLITED' })),
    );
    setQueryParams({ id: 'pkg-9' });

    component.ngOnInit();

    expect(component.adminActiveTab).toBe('archived');
    expect(mockInvestmentPackageService.filterArchivedInvestmentPackages).toHaveBeenCalled();
    expect(component.selectedInvestmentPackage?.id).toBe('pkg-9');
  });

  it('forces the requested detail-panel tab once, then releases it', () => {
    vi.useFakeTimers();
    const { component, mockInvestmentPackageService, setQueryParams } = makeComponent();
    mockInvestmentPackageService.getInvestmentPackageById.mockReturnValue(
      of(mockPackage({ id: 'pkg-1', packageStatus: 'IN_USE' })),
    );
    setQueryParams({ id: 'pkg-1', panel: 'contract' });
    const keyBefore = component.detailRefreshKey;

    component.ngOnInit();

    expect(component.forcedPanel).toBe('contract');
    expect(component.detailRefreshKey).toBeGreaterThan(keyBefore);
    vi.runAllTimers();
    expect(component.forcedPanel).toBeNull();
  });

  it('re-selects when the id changes while the page is already open', () => {
    const { component, mockInvestmentPackageService, setQueryParams } = makeComponent();
    mockInvestmentPackageService.getInvestmentPackageById.mockImplementation((id: string) =>
      of(mockPackage({ id, packageStatus: 'ACTIVE' })));
    component.ngOnInit();

    setQueryParams({ id: 'pkg-a' });
    expect(component.selectedInvestmentPackage?.id).toBe('pkg-a');
    setQueryParams({ id: 'pkg-b' });
    expect(component.selectedInvestmentPackage?.id).toBe('pkg-b');
  });

  it('still loads the list when the by-id fetch fails', () => {
    const { component, mockInvestmentPackageService, setQueryParams } = makeComponent();
    mockInvestmentPackageService.getInvestmentPackageById.mockReturnValue(throwError(() => new Error('404')));
    setQueryParams({ id: 'gone' });

    component.ngOnInit();

    expect(mockInvestmentPackageService.filterPublishedInvestmentPackages).toHaveBeenCalled();
  });

  it('loads the published tab as usual with no deep-link query params', () => {
    const { component, mockInvestmentPackageService } = makeComponent();

    component.ngOnInit();

    expect(component.adminActiveTab).toBe('published');
    expect(mockInvestmentPackageService.getInvestmentPackageById).not.toHaveBeenCalled();
    expect(mockInvestmentPackageService.filterPublishedInvestmentPackages).toHaveBeenCalled();
  });
});
