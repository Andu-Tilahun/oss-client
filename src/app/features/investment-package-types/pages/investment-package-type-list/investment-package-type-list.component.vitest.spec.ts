import { describe, it, expect, vi } from 'vitest';
import { of } from 'rxjs';
import { InvestmentPackageTypeListComponent } from './investment-package-type-list.component';
import { InvestmentPackageTypeAgreement } from '../../models/investment-package-type.model';

function mockAgreement(overrides: Partial<InvestmentPackageTypeAgreement>): InvestmentPackageTypeAgreement {
  return {
    id: 'agr-1',
    startDate: '2026-01-01',
    endDate: '2026-06-01',
    farmActivity: 'CROPS',
    waterSource: 'RAIN_FED',
    title: 'Agreement',
    targetAmount: 1000,
    minimumContribution: 1000,
    fundingStatus: 'OPEN',
    farmPlot: {} as any,
    ...overrides,
  } as InvestmentPackageTypeAgreement;
}

function makeComponent(opts: {
  role: 'admin' | 'investor' | 'extensionWorker';
  packageId?: string;
  tab?: string;
  archived?: InvestmentPackageTypeAgreement[];
  published?: InvestmentPackageTypeAgreement[];
} ) {
  const archived = opts.archived ?? [];
  const published = opts.published ?? [];

  const mockInvestmentPackageTypeService = {
    filter: vi.fn((req: {packageStatuses?: string[]}) => {
      const wantsArchived = req.packageStatuses?.includes('INACTIVE');
      return of({ content: wantsArchived ? archived : published } as any);
    }),
  };
  const mockInvestmentPackageService = {};
  const mockToastService = { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() };
  const mockAuthService = {
    isAdmin: vi.fn(() => opts.role === 'admin'),
    isInvestor: vi.fn(() => opts.role === 'investor'),
    isExtensionWorker: vi.fn(() => opts.role === 'extensionWorker'),
    getCurrentUser: vi.fn(() => ({ id: 'user-1' })),
  };
  const mockRouter = { navigate: vi.fn() };

  const queryParamMap = {
    get: (key: string) => (key === 'packageId' ? opts.packageId ?? null : key === 'tab' ? opts.tab ?? null : null),
  };
  const routeData = { investmentPackageType: 'LEASING', pageTitle: 'Leasing Investment Packages' };
  const mockRoute = {
    snapshot: { data: routeData, queryParamMap },
    data: of(routeData),
  };
  const mockDestroyRef = { onDestroy: (_cb: () => void) => () => {} };

  const component = new InvestmentPackageTypeListComponent(
    mockInvestmentPackageTypeService as any,
    mockInvestmentPackageService as any,
    mockToastService as any,
    mockAuthService as any,
    mockRouter as any,
    mockRoute as any,
    mockDestroyRef as any,
  );

  return { component };
}

describe('InvestmentPackageTypeListComponent deep-link tab selection', () => {
  it('admin: switches to the archived tab and selects the exact package when tab=archived', () => {
    const target = mockAgreement({ id: 'pkg-2', title: 'Closed Package', packageStatus: 'INACTIVE' as any });
    const { component } = makeComponent({
      role: 'admin',
      packageId: 'pkg-2',
      tab: 'archived',
      archived: [mockAgreement({ id: 'pkg-1', title: 'Other Closed Package' }), target],
    });

    component.ngOnInit();

    expect(component.adminActiveTab).toBe('archived');
    expect(component.selectedAgreement?.id).toBe('pkg-2');
  });

  it('investor: switches to the history tab and selects the exact package when tab=archived', () => {
    const target = mockAgreement({ id: 'pkg-2', title: 'Closed Package', investorId: 'user-1' });
    const { component } = makeComponent({
      role: 'investor',
      packageId: 'pkg-2',
      tab: 'archived',
      archived: [mockAgreement({ id: 'pkg-1', title: 'Other Closed Package', investorId: 'user-1' }), target],
    });

    component.ngOnInit();

    expect(component.investorActiveTab).toBe('history');
    expect(component.selectedAgreement?.id).toBe('pkg-2');
  });

  it('extension worker: switches to the history tab and selects the exact package when tab=archived', () => {
    const target = mockAgreement({ id: 'pkg-2', title: 'Closed Package' });
    const { component } = makeComponent({
      role: 'extensionWorker',
      packageId: 'pkg-2',
      tab: 'archived',
      archived: [mockAgreement({ id: 'pkg-1', title: 'Other Closed Package' }), target],
    });

    component.ngOnInit();

    expect(component.extensionWorkerActiveTab).toBe('history');
    expect(component.selectedAgreement?.id).toBe('pkg-2');
  });

  it('admin: stays on the published tab and selects the exact package when tab=published', () => {
    const target = mockAgreement({ id: 'pkg-2', title: 'Open Package' });
    const { component } = makeComponent({
      role: 'admin',
      packageId: 'pkg-2',
      tab: 'published',
      published: [mockAgreement({ id: 'pkg-1', title: 'Other Open Package' }), target],
    });

    component.ngOnInit();

    expect(component.adminActiveTab).toBe('published');
    expect(component.selectedAgreement?.id).toBe('pkg-2');
  });
});

describe('InvestmentPackageTypeListComponent stage-gated tabs (admin)', () => {
  function tabKeys(component: InvestmentPackageTypeListComponent): string[] {
    return component.tabs.map((t) => t.key);
  }

  function select(component: InvestmentPackageTypeListComponent, overrides: Partial<InvestmentPackageTypeAgreement>) {
    component.onView(mockAgreement({ id: 'pkg-1', ...overrides }));
  }

  it('OPEN, no contract: shows only the base tabs', () => {
    const { component } = makeComponent({ role: 'admin' });
    component.ngOnInit();

    select(component, { fundingStatus: 'OPEN' as any });

    expect(tabKeys(component)).toEqual(['detail', 'farm-plot', 'investor']);
  });

  it('CLOSED, no agreementId yet: adds Contract', () => {
    const { component } = makeComponent({ role: 'admin' });
    component.ngOnInit();

    select(component, { fundingStatus: 'CLOSED' as any });

    expect(tabKeys(component)).toEqual(['detail', 'farm-plot', 'investor', 'contract']);
  });

  it('contract signed, no worker yet: adds Extension Worker with a needs-action badge, keeps Contract', () => {
    const { component } = makeComponent({ role: 'admin' });
    component.ngOnInit();

    select(component, { fundingStatus: 'CLOSED' as any, agreementId: 'agr-9', status: 'ACTIVE' as any });

    expect(tabKeys(component)).toEqual(['detail', 'farm-plot', 'investor', 'contract', 'extension-worker']);
    expect(component.tabs.find((t) => t.key === 'extension-worker')?.badge).toBe(1);
  });

  it('worker assigned and fundingStatus has moved to FUNDED: Contract and Extension Worker stay visible, FollowUp is added', () => {
    const { component } = makeComponent({ role: 'admin' });
    component.ngOnInit();

    select(component, {
      fundingStatus: 'FUNDED' as any,
      agreementId: 'agr-9',
      status: 'ACTIVE' as any,
      extensionWorker: { id: 'worker-1' } as any,
      followUpDtoList: [],
    });

    expect(tabKeys(component)).toEqual(['detail', 'farm-plot', 'investor', 'contract', 'extension-worker', 'follow-up']);
    expect(component.tabs.find((t) => t.key === 'extension-worker')?.badge).toBeUndefined();
    expect(component.tabs.find((t) => t.key === 'follow-up')?.badge).toBe(1);
  });

  it('completed archived package with no "status" field: Extension Worker still shows because a worker is assigned', () => {
    const { component } = makeComponent({ role: 'admin' });
    component.ngOnInit();

    select(component, {
      fundingStatus: 'FUNDED' as any,
      packageStatus: 'COMPLITED' as any,
      agreementId: 'agr-9',
      status: undefined,
      extensionWorker: { id: 'worker-1' } as any,
      followUpDtoList: [{ id: 'fu-1' } as any],
    });

    expect(tabKeys(component)).toEqual(['detail', 'farm-plot', 'investor', 'contract', 'extension-worker', 'follow-up']);
  });

  it('funding later force-closed to FAILED after a contract/worker already existed: Contract still shows', () => {
    const { component } = makeComponent({ role: 'admin' });
    component.ngOnInit();

    select(component, {
      fundingStatus: 'FAILED' as any,
      packageStatus: 'INACTIVE' as any,
      agreementId: 'agr-9',
      status: undefined,
      extensionWorker: { id: 'worker-1' } as any,
      followUpDtoList: [{ id: 'fu-1' } as any, { id: 'fu-2' } as any],
    });

    expect(tabKeys(component)).toEqual(['detail', 'farm-plot', 'investor', 'contract', 'extension-worker', 'follow-up']);
  });

  it('worker assigned with existing follow-ups: FollowUp has no needs-action badge', () => {
    const { component } = makeComponent({ role: 'admin' });
    component.ngOnInit();

    select(component, {
      fundingStatus: 'FUNDED' as any,
      agreementId: 'agr-9',
      status: 'ACTIVE' as any,
      extensionWorker: { id: 'worker-1' } as any,
      followUpDtoList: [{ id: 'fu-1' } as any],
    });

    expect(component.tabs.find((t) => t.key === 'follow-up')?.badge).toBeUndefined();
  });
});
