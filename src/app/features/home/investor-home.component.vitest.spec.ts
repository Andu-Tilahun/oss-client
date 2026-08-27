import {describe, it, expect, beforeEach, vi} from 'vitest';
import {of} from 'rxjs';
import {InvestorHomeComponent} from './investor-home.component';
import {InvestmentPackage, InvestmentRecord} from '../investment-package/models/investment-package.model';
import {PageResponse} from '../../shared/models/api-response.model';

function mockInvestment(overrides: Partial<InvestmentRecord>): InvestmentRecord {
  return {
    id: 'inv-1',
    investmentPackageId: 'pkg-1',
    investorId: 'investor-1',
    amount: 1000,
    paymentMethod: 'BANK_TRANSFER',
    status: 'ACTIVE',
    createdAt: '2026-01-15T00:00:00Z',
    investmentPackage: {
      id: 'pkg-1',
      farmPlotId: 'plot-1',
      startDate: '2026-01-01',
      endDate: '2026-12-01',
      farmActivity: 'CROPS',
      waterSource: 'IRRIGATION',
      title: 'Package 1',
      targetAmount: 10000,
      minimumContribution: 100,
      fundingStatus: 'OPEN' as any,
      investmentPackageType: 'CROWDFUNDING',
      farmPlot: {} as any,
    },
    ...overrides,
  };
}

function mockPage<T>(content: T[], totalElements?: number): PageResponse<T> {
  return {
    content,
    totalElements: totalElements ?? content.length,
    totalPages: 1,
    size: content.length || 10,
    number: 0,
    first: true,
    last: true,
  };
}

function makeComponent() {
  const mockInvestmentPackageService = {
    filterInvestments: vi.fn(() => of(mockPage<InvestmentRecord>([]))),
    filterInvestmentPackages: vi.fn(() => of(mockPage<InvestmentPackage>([]))),
  };
  const component = new InvestorHomeComponent(mockInvestmentPackageService as any);
  return {component, mockInvestmentPackageService};
}

describe('InvestorHomeComponent', () => {
  let component: InvestorHomeComponent;
  let mockInvestmentPackageService: ReturnType<typeof makeComponent>['mockInvestmentPackageService'];

  beforeEach(() => {
    ({component, mockInvestmentPackageService} = makeComponent());
  });

  it('should create', () => expect(component).toBeTruthy());

  it('deployed capital / active count only include PAID, ACTIVE, ACCEPTED, SENT statuses', () => {
    const investments = [
      mockInvestment({id: '1', amount: 1000, status: 'ACTIVE'}),
      mockInvestment({id: '2', amount: 2000, status: 'PAID'}),
      mockInvestment({id: '3', amount: 3000, status: 'ACCEPTED'}),
      mockInvestment({id: '4', amount: 4000, status: 'SENT'}),
      mockInvestment({id: '5', amount: 5000, status: 'PENDING'}),
      mockInvestment({id: '6', amount: 6000, status: 'REJECTED'}),
      mockInvestment({id: '7', amount: 7000, status: 'CANCELED'}),
    ];
    mockInvestmentPackageService.filterInvestments.mockReturnValue(of(mockPage(investments)));

    component.ngOnInit();

    expect(component.totalDeployedCapital).toBe(1000 + 2000 + 3000 + 4000);
    expect(component.activeInvestmentsCount).toBe(4);
  });

  it('blended ROI is amount-weighted and ignores unparseable roi values', () => {
    const investments = [
      mockInvestment({id: '1', amount: 1000, roi: '10%'}),
      mockInvestment({id: '2', amount: 3000, roi: '20%'}),
      mockInvestment({id: '3', amount: 5000, roi: undefined}),
      mockInvestment({id: '4', amount: 2000, roi: 'not-a-number'}),
    ];
    mockInvestmentPackageService.filterInvestments.mockReturnValue(of(mockPage(investments)));

    component.ngOnInit();

    // Weighted: (1000*10 + 3000*20) / (1000+3000) = 70000/4000 = 17.5
    expect(component.blendedRoiPct).toBe(17.5);
  });

  it('blended ROI is null when no investment has a parseable roi', () => {
    const investments = [mockInvestment({id: '1', amount: 1000, roi: undefined})];
    mockInvestmentPackageService.filterInvestments.mockReturnValue(of(mockPage(investments)));

    component.ngOnInit();

    expect(component.blendedRoiPct).toBeNull();
  });

  it('open opportunities count comes from the open-campaigns page total, not content length', () => {
    mockInvestmentPackageService.filterInvestmentPackages.mockImplementation((req: any) => {
      if (req.size === 1) return of(mockPage<InvestmentPackage>([], 42));
      return of(mockPage<InvestmentPackage>([]));
    });

    component.ngOnInit();

    expect(component.openOpportunitiesCount).toBe(42);
  });

  it('status breakdown groups by investment status across all statuses, not just deployed', () => {
    const investments = [
      mockInvestment({id: '1', status: 'ACTIVE'}),
      mockInvestment({id: '2', status: 'ACTIVE'}),
      mockInvestment({id: '3', status: 'PENDING'}),
    ];
    mockInvestmentPackageService.filterInvestments.mockReturnValue(of(mockPage(investments)));

    component.ngOnInit();

    const active = component.statusBreakdown.find((s) => s.label === 'Active');
    const pending = component.statusBreakdown.find((s) => s.label === 'Pending');
    expect(active?.value).toBe(2);
    expect(pending?.value).toBe(1);
  });

  it('package type breakdown sums amounts by investmentPackageType for deployed investments only', () => {
    const investments = [
      mockInvestment({
        id: '1',
        amount: 1000,
        status: 'ACTIVE',
        investmentPackage: {...mockInvestment({}).investmentPackage!, investmentPackageType: 'LEASING'},
      }),
      mockInvestment({
        id: '2',
        amount: 500,
        status: 'PENDING',
        investmentPackage: {...mockInvestment({}).investmentPackage!, investmentPackageType: 'LEASING'},
      }),
      mockInvestment({
        id: '3',
        amount: 2000,
        status: 'PAID',
        investmentPackage: {...mockInvestment({}).investmentPackage!, investmentPackageType: 'CROWDFUNDING'},
      }),
    ];
    mockInvestmentPackageService.filterInvestments.mockReturnValue(of(mockPage(investments)));

    component.ngOnInit();

    const leasing = component.packageTypeBreakdown.find((s) => s.label === 'Leasing');
    const crowd = component.packageTypeBreakdown.find((s) => s.label === 'Crowdfunding');
    expect(leasing?.value).toBe(1000); // PENDING excluded
    expect(crowd?.value).toBe(2000);
  });

  it('portfolio trend accumulates cumulatively across months in chronological order', () => {
    const investments = [
      mockInvestment({id: '1', amount: 1000, status: 'ACTIVE', createdAt: '2026-01-10T00:00:00Z'}),
      mockInvestment({id: '2', amount: 500, status: 'PAID', createdAt: '2026-01-20T00:00:00Z'}),
      mockInvestment({id: '3', amount: 2000, status: 'SENT', createdAt: '2026-03-05T00:00:00Z'}),
    ];
    mockInvestmentPackageService.filterInvestments.mockReturnValue(of(mockPage(investments)));

    component.ngOnInit();

    expect(component.portfolioTrend.map((p) => p.cumulative)).toEqual([1500, 3500]);
  });

  it('monthly activity counts investments created in the current month', () => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 5).toISOString();
    const investments = [
      mockInvestment({id: '1', amount: 100, createdAt: thisMonth}),
      mockInvestment({id: '2', amount: 200, createdAt: thisMonth}),
    ];
    mockInvestmentPackageService.filterInvestments.mockReturnValue(of(mockPage(investments)));

    component.ngOnInit();

    const currentMonthPoint = component.monthlyActivity[component.monthlyActivity.length - 1];
    expect(currentMonthPoint.count).toBe(2);
    expect(currentMonthPoint.amount).toBe(300);
  });
});
