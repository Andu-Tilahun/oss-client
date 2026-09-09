import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { PublicWebsiteComponent } from './public-website.component';
import { InvestmentPackage } from '../../features/investment-package/models/investment-package.model';
import { FundingStatus } from '../../shared/models/funding-status.model';
import { PageResponse } from '../../shared/models/api-response.model';

function makePackage(id: string, overrides: Partial<InvestmentPackage> = {}): InvestmentPackage {
  return {
    id,
    farmPlotId: `plot-${id}`,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    farmActivity: 'CROPS',
    waterSource: 'IRRIGATION',
    title: `Package ${id}`,
    targetAmount: 1000,
    minimumContribution: 100,
    fundingStatus: FundingStatus.OPEN,
    packageStatus: 'ACTIVE',
    farmPlot: {} as any,
    ...overrides,
  };
}

function makePageResponse(content: InvestmentPackage[]): PageResponse<InvestmentPackage> {
  return {
    content,
    totalElements: content.length,
    totalPages: 1,
    size: content.length,
    number: 0,
    first: true,
    last: true,
  };
}

function makeComponent(packages: InvestmentPackage[] = []) {
  const investmentPackageService = {
    getPublicInvestmentPackages: vi.fn(() => of(makePageResponse(packages))),
  };
  const farmPlotService = {
    getPublicFarmPlotGallery: vi.fn(() => of([])),
  };
  const companyProfileService = {
    getCompanyProfile: vi.fn(() => of({} as any)),
  };
  const router = {
    navigate: vi.fn(),
  };
  const route = {
    fragment: of(null),
  };

  const component = new PublicWebsiteComponent(
    investmentPackageService as any,
    farmPlotService as any,
    companyProfileService as any,
    router as any,
    route as any,
  );

  return { component, investmentPackageService, farmPlotService, companyProfileService, router };
}

describe('PublicWebsiteComponent', () => {
  it('should create', () => {
    const { component } = makeComponent();
    expect(component).toBeTruthy();
  });

  describe('loadPackages', () => {
    it('caps previewPackages to 8 while packages holds the full eligible set', () => {
      const nine = Array.from({ length: 9 }, (_, i) => makePackage(`${i}`));
      const { component } = makeComponent(nine);

      component.loadPackages();

      expect(component.packages).toHaveLength(9);
      expect(component.previewPackages).toHaveLength(8);
      expect(component.previewPackages).toEqual(nine.slice(0, 8));
      expect(component.loadingPackages).toBe(false);
    });

    it('excludes packages that are not OPEN, or are INACTIVE or COMPLITED', () => {
      const mixed = [
        makePackage('open', { fundingStatus: FundingStatus.OPEN, packageStatus: 'ACTIVE' }),
        makePackage('closed', { fundingStatus: FundingStatus.CLOSED, packageStatus: 'ACTIVE' }),
        makePackage('inactive', { fundingStatus: FundingStatus.OPEN, packageStatus: 'INACTIVE' }),
        makePackage('completed', { fundingStatus: FundingStatus.OPEN, packageStatus: 'COMPLITED' }),
      ];
      const { component } = makeComponent(mixed);

      component.loadPackages();

      expect(component.packages).toHaveLength(1);
      expect(component.packages[0].id).toBe('open');
    });

    it('sets loadingPackages true while the request is in flight', () => {
      const { component, investmentPackageService } = makeComponent();
      investmentPackageService.getPublicInvestmentPackages.mockReturnValue(of(makePageResponse([])) as any);

      expect(component.loadingPackages).toBe(false);
      component.loadPackages();
      expect(component.loadingPackages).toBe(false);
    });

    it('resets packages and previewPackages on error', () => {
      const { component, investmentPackageService } = makeComponent();
      investmentPackageService.getPublicInvestmentPackages.mockReturnValue(
        throwError(() => new Error('fail')) as any,
      );

      component.loadPackages();

      expect(component.packages).toHaveLength(0);
      expect(component.previewPackages).toHaveLength(0);
      expect(component.loadingPackages).toBe(false);
    });
  });

  describe('hasMorePackages', () => {
    it('is false when there are exactly 8 eligible packages', () => {
      const eight = Array.from({ length: 8 }, (_, i) => makePackage(`${i}`));
      const { component } = makeComponent(eight);

      component.loadPackages();

      expect(component.hasMorePackages).toBe(false);
    });

    it('is true when there are 9 eligible packages', () => {
      const nine = Array.from({ length: 9 }, (_, i) => makePackage(`${i}`));
      const { component } = makeComponent(nine);

      component.loadPackages();

      expect(component.hasMorePackages).toBe(true);
    });
  });

  describe('goToLogin', () => {
    it('navigates to /login', () => {
      const { component, router } = makeComponent();

      component.goToLogin();

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });
});
