import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { InvestmentPackageEditWizardComponent } from './investment-package-edit-wizard.component';
import { InvestmentPackage } from '../../models/investment-package.model';

function mockPackage(overrides: Partial<InvestmentPackage> = {}): InvestmentPackage {
  return {
    id: 'pkg-1',
    farmPlotId: 'plot-1',
    farmPlot: { id: 'plot-1', title: 'North Field' } as any,
    title: 'North Field Package',
    investmentPackageType: 'CROWDFUNDING',
    farmActivity: 'CROPS',
    waterSource: 'RAIN_FED',
    startDate: '2026-01-01',
    endDate: '2026-06-01',
    fundingDeadline: '2026-03-01T00:00:00Z',
    targetAmount: 1000,
    minimumContribution: 100,
    expectedInvestorNumber: 5,
    fundingStatus: 'OPEN' as any,
    allowedPaymentMethods: ['CRYPTO'],
    allowedBankAccountIds: [],
    ...overrides,
  } as InvestmentPackage;
}

function makeComponent() {
  const mockSystemConfigService = {
    getActiveBankAccounts: vi.fn(() => of([])),
  };

  const component = new InvestmentPackageEditWizardComponent(new FormBuilder(), mockSystemConfigService as any);

  return { component, mockSystemConfigService };
}

function patch(component: InvestmentPackageEditWizardComponent, pkg: InvestmentPackage) {
  component.investmentPackage = pkg;
  component.ngOnChanges({ investmentPackage: {} as any });
}

describe('InvestmentPackageEditWizardComponent', () => {
  let component: InvestmentPackageEditWizardComponent;

  beforeEach(() => {
    ({ component } = makeComponent());
    component.ngOnInit();
  });

  it('should create', () => expect(component).toBeTruthy());

  describe('ngOnChanges pre-population', () => {
    it('patches all three step forms from the given investment package', () => {
      patch(component, mockPackage());

      expect(component.detailsForm.value.title).toBe('North Field Package');
      expect(component.detailsForm.value.farmActivity).toBe('CROPS');
      expect(component.datesForm.value.startDate).toBe('2026-01-01');
      expect(component.datesForm.value.endDate).toBe('2026-06-01');
      expect(component.paymentForm.value.targetAmount).toBe(1000);
      expect(component.paymentForm.value.minimumContribution).toBe(100);
      expect(component.paymentForm.value.expectedInvestorNumber).toBe(5);
      expect(component.paymentForm.value.fundingStatus).toBe('OPEN');
    });

    it('applies CROWDFUNDING-only validators based on the package type, not a form control', () => {
      patch(component, mockPackage({ investmentPackageType: 'LEASING' }));

      expect(component.paymentForm.get('minimumContribution')?.validator).toBeNull();
      expect(component.isCrowdfunding).toBe(false);
    });
  });

  describe('locked identity fields', () => {
    it('getValue() always uses the original package farmPlotId and investmentPackageType, never the form', () => {
      patch(component, mockPackage({ farmPlotId: 'plot-9', investmentPackageType: 'BIDDING' }));

      const value = component.getValue();

      expect(value.farmPlotId).toBe('plot-9');
      expect(value.investmentPackageType).toBe('BIDDING');
    });

    it('previewData reflects the locked farm plot title and package type from the input, not an editable field', () => {
      patch(component, mockPackage({ investmentPackageType: 'LEASING' }));

      const preview = component.previewData;

      expect(preview.farmPlotTitle).toBe('North Field');
      expect(preview.investmentPackageType).toBe('LEASING');
    });
  });

  describe('getValue', () => {
    it('includes fundingStatus from the Payment step', () => {
      patch(component, mockPackage());
      component.paymentForm.patchValue({ fundingStatus: 'CLOSED' });

      expect(component.getValue().fundingStatus).toBe('CLOSED');
    });

    it('defaults minimumContribution to targetAmount and expectedInvestorNumber to 1 for non-crowdfunding', () => {
      patch(component, mockPackage({ investmentPackageType: 'LEASING' }));
      component.paymentForm.patchValue({ targetAmount: 2500 });

      const value = component.getValue();

      expect(value.minimumContribution).toBe(2500);
      expect(value.expectedInvestorNumber).toBe(1);
    });
  });

  describe('isStepValid', () => {
    it('step 1 requires a title', () => {
      patch(component, mockPackage());
      component.detailsForm.patchValue({ title: '' });
      expect(component.isStepValid(1)).toBe(false);
      component.detailsForm.patchValue({ title: 'Something' });
      expect(component.isStepValid(1)).toBe(true);
    });
  });
});
