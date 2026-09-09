import {describe, it, expect, beforeEach, vi} from 'vitest';
import {of} from 'rxjs';
import {InvestorAnalyticsPageComponent} from './investor-analytics-page.component';
import {
  InvestmentAgreement,
  InvestmentPackage,
  InvestmentRecord,
} from '../investment-package/models/investment-package.model';
import {PageResponse} from '../../shared/models/api-response.model';
import {Region} from '../regions/models/region.model';

function mockPackage(overrides: Partial<InvestmentPackage>): InvestmentPackage {
  return {
    id: 'pkg-1',
    farmPlotId: 'plot-1',
    startDate: '2026-01-01',
    endDate: '2026-12-01',
    farmActivity: 'CROPS',
    waterSource: 'IRRIGATION',
    title: 'Package 1',
    targetAmount: 10000,
    minimumContribution: 500,
    fundingStatus: 'OPEN' as any,
    investmentPackageType: 'CROWDFUNDING',
    expectedInvestorNumber: 10,
    investorIdList: [],
    farmPlot: {id: 'plot-1', title: 'Plot 1', size: 10, sizeType: 'HECTARES', soilType: 'LOAMY'} as any,
    ...overrides,
  };
}

function mockInvestment(overrides: Partial<InvestmentRecord>): InvestmentRecord {
  return {
    id: 'inv-1',
    investmentPackageId: 'pkg-1',
    investorId: 'investor-1',
    amount: 1000,
    paymentMethod: 'BANK_TRANSFER',
    status: 'ACTIVE',
    createdAt: '2026-01-15T00:00:00Z',
    investmentPackage: mockPackage({}),
    ...overrides,
  };
}

function mockAgreement(overrides: Partial<InvestmentAgreement>): InvestmentAgreement {
  return {
    id: 'agr-1',
    farmPlotId: 'plot-1',
    investmentPackageId: 'pkg-1',
    investorIdList: ['investor-1'],
    startDate: '2026-01-01',
    endDate: '2026-12-01',
    totalDurationMonths: 11,
    status: 'ACTIVE',
    totalAmount: 5000,
    investmentPackageType: 'LEASING',
    farmPlot: {id: 'plot-1', title: 'Plot 1'} as any,
    ...overrides,
  };
}

function mockPage<T>(content: T[]): PageResponse<T> {
  return {content, totalElements: content.length, totalPages: 1, size: content.length || 10, number: 0, first: true, last: true};
}

function makeComponent() {
  const mockInvestmentPackageService = {
    filterInvestments: vi.fn(() => of(mockPage<InvestmentRecord>([]))),
    filterAgreements: vi.fn(() => of(mockPage<InvestmentAgreement>([]))),
    filterPublishedInvestmentPackages: vi.fn(() => of(mockPage<InvestmentPackage>([]))),
    getStatusSummary: vi.fn(() => of({fundingStatusCounts: {}, packageStatusCounts: {}})),
  };
  const mockRegionService = {
    filterRegions: vi.fn(() => of(mockPage<Region>([]))),
  };
  const component = new InvestorAnalyticsPageComponent(mockInvestmentPackageService as any, mockRegionService as any);
  return {component, mockInvestmentPackageService, mockRegionService};
}

describe('InvestorAnalyticsPageComponent', () => {
  let component: InvestorAnalyticsPageComponent;
  let mockInvestmentPackageService: ReturnType<typeof makeComponent>['mockInvestmentPackageService'];
  let mockRegionService: ReturnType<typeof makeComponent>['mockRegionService'];

  beforeEach(() => {
    ({component, mockInvestmentPackageService, mockRegionService} = makeComponent());
  });

  it('should create', () => expect(component).toBeTruthy());

  it('requests all 7 agreement statuses explicitly (backend defaults silently exclude TERMINATED/REJECTED otherwise)', () => {
    component.ngOnInit();

    expect(mockInvestmentPackageService.filterAgreements).toHaveBeenCalledWith(
      expect.objectContaining({
        statuses: expect.arrayContaining(['ACTIVE', 'PENDING', 'TERMINATED', 'SENT', 'ACCEPTED', 'REJECTED', 'CANCELED']),
      }),
    );
  });

  it('agreement status funnel includes all 7 statuses even when some are zero', () => {
    mockInvestmentPackageService.filterAgreements.mockReturnValue(
      of(mockPage([mockAgreement({status: 'ACTIVE'}), mockAgreement({id: 'agr-2', status: 'ACTIVE'})])),
    );

    component.ngOnInit();

    expect(component.agreementStatusFunnel).toHaveLength(7);
    const active = component.agreementStatusFunnel.find((s) => s.label === 'Active');
    const terminated = component.agreementStatusFunnel.find((s) => s.label === 'Terminated');
    expect(active?.value).toBe(2);
    expect(terminated?.value).toBe(0);
  });

  it('capital allocation by region resolves region names and only counts deployed statuses', () => {
    mockRegionService.filterRegions.mockReturnValue(of(mockPage([{id: 'region-1', name: 'Oromia'}])));
    const investments = [
      mockInvestment({
        id: '1',
        amount: 1000,
        status: 'ACTIVE',
        investmentPackage: mockPackage({farmPlot: {id: 'plot-1', title: 'Plot 1', regionId: 'region-1'} as any}),
      }),
      mockInvestment({
        id: '2',
        amount: 5000,
        status: 'PENDING',
        investmentPackage: mockPackage({farmPlot: {id: 'plot-1', title: 'Plot 1', regionId: 'region-1'} as any}),
      }),
    ];
    mockInvestmentPackageService.filterInvestments.mockReturnValue(of(mockPage(investments)));

    component.ngOnInit();

    expect(component.regionBreakdown).toEqual([{label: 'Oromia', value: 1000}]);
  });

  it('payment method mix groups deployed investments by paymentMethod', () => {
    const investments = [
      mockInvestment({id: '1', amount: 1000, status: 'PAID', paymentMethod: 'CREDIT'}),
      mockInvestment({id: '2', amount: 2000, status: 'ACTIVE', paymentMethod: 'CREDIT'}),
      mockInvestment({id: '3', amount: 3000, status: 'SENT', paymentMethod: 'CRYPTO'}),
    ];
    mockInvestmentPackageService.filterInvestments.mockReturnValue(of(mockPage(investments)));

    component.ngOnInit();

    const credit = component.paymentMethodBreakdown.find((s) => s.label === 'Credit');
    const crypto = component.paymentMethodBreakdown.find((s) => s.label === 'Crypto');
    expect(credit?.value).toBe(3000);
    expect(crypto?.value).toBe(3000);
  });

  it('crowdfunding fill rate computes investorIdList.length / expectedInvestorNumber for open CROWDFUNDING packages only', () => {
    const openPackages = [
      mockPackage({id: 'p1', investmentPackageType: 'CROWDFUNDING', expectedInvestorNumber: 10, investorIdList: ['a', 'b', 'c', 'd', 'e']}),
      mockPackage({id: 'p2', investmentPackageType: 'LEASING'}),
    ];
    mockInvestmentPackageService.filterPublishedInvestmentPackages.mockReturnValue(of(mockPage(openPackages)));

    component.ngOnInit();

    expect(component.crowdfundingFillRate).toHaveLength(1);
    expect(component.crowdfundingFillRate[0].value).toBe(50);
    expect(component.crowdfundingFillRate[0].investorCount).toBe(5);
  });

  it('minimum contribution bucketing places packages into the correct tier', () => {
    const openPackages = [
      mockPackage({id: 'p1', minimumContribution: 500}),
      mockPackage({id: 'p2', minimumContribution: 3000}),
      mockPackage({id: 'p3', minimumContribution: 150000}),
    ];
    mockInvestmentPackageService.filterPublishedInvestmentPackages.mockReturnValue(of(mockPage(openPackages)));

    component.ngOnInit();

    const under1k = component.contributionTiers.find((t) => t.label === '<1K');
    const oneTo5k = component.contributionTiers.find((t) => t.label === '1K–5K');
    const over100k = component.contributionTiers.find((t) => t.label === '100K+');
    expect(under1k?.value).toBe(1);
    expect(oneTo5k?.value).toBe(1);
    expect(over100k?.value).toBe(1);
  });

  it('platform-wide funding outcomes come from the aggregate status-summary endpoint, not row-level data', () => {
    mockInvestmentPackageService.getStatusSummary.mockReturnValue(
      of({fundingStatusCounts: {OPEN: 4, CLOSED: 2, FUNDED: 1, FAILED: 0}, packageStatusCounts: {}}),
    );

    component.ngOnInit();

    const open = component.platformFundingOutcomes.find((s) => s.label === 'Open');
    const closed = component.platformFundingOutcomes.find((s) => s.label === 'Closed');
    expect(open?.value).toBe(4);
    expect(closed?.value).toBe(2);
  });

  it('map locations only include open packages with plottable coordinates', () => {
    const openPackages = [
      mockPackage({id: 'p1', title: 'With coords', farmPlot: {id: 'plot-1', title: 'Plot', latitude: 9.1, longitude: 40.5} as any}),
      mockPackage({id: 'p2', title: 'No coords', farmPlot: {id: 'plot-2', title: 'Plot 2'} as any}),
    ];
    mockInvestmentPackageService.filterPublishedInvestmentPackages.mockReturnValue(of(mockPage(openPackages)));

    component.ngOnInit();

    expect(component.openPackageLocations).toHaveLength(1);
    expect(component.openPackageLocations[0].name).toBe('With coords');
  });
});
