import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { InvestmentPackageCreateWizardComponent } from './investment-package-create-wizard.component';

function makeComponent() {
  const mockFarmPlotService = {
    filterFarmPlots: vi.fn(() => of({ content: [{ id: 'plot-1', title: 'North Field' }] } as any)),
  };
  const mockSystemConfigService = {
    getActiveBankAccounts: vi.fn(() => of([])),
  };

  const component = new InvestmentPackageCreateWizardComponent(
    new FormBuilder(),
    mockFarmPlotService as any,
    mockSystemConfigService as any,
  );

  return { component, mockFarmPlotService, mockSystemConfigService };
}

function fillDetails(component: InvestmentPackageCreateWizardComponent, overrides: Record<string, any> = {}) {
  component.detailsForm.patchValue({
    farmPlotId: 'plot-1',
    title: 'North Field Package',
    investmentPackageType: 'CROWDFUNDING',
    farmActivity: 'CROPS',
    waterSource: 'RAIN_FED',
    ...overrides,
  });
}

function fillDates(component: InvestmentPackageCreateWizardComponent, overrides: Record<string, any> = {}) {
  component.datesForm.patchValue({
    startDate: '2026-01-01',
    endDate: '2026-06-01',
    fundingDeadline: '2026-03-01T00:00',
    ...overrides,
  });
}

function fillPayment(component: InvestmentPackageCreateWizardComponent, overrides: Record<string, any> = {}) {
  component.paymentForm.patchValue({
    targetAmount: 1000,
    minimumContribution: 100,
    expectedInvestorNumber: 5,
    ...overrides,
  });
}

describe('InvestmentPackageCreateWizardComponent', () => {
  let component: InvestmentPackageCreateWizardComponent;

  beforeEach(() => {
    ({ component } = makeComponent());
    component.ngOnInit();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('loads active farm plots on init', () => {
    expect(component.farmPlots).toEqual([{ id: 'plot-1', title: 'North Field' }]);
  });

  describe('isStepValid', () => {
    it('step 1 is invalid until required Details fields are filled', () => {
      expect(component.isStepValid(1)).toBe(false);
      fillDetails(component);
      expect(component.isStepValid(1)).toBe(true);
    });

    it('step 2 is invalid until required Dates fields are filled', () => {
      expect(component.isStepValid(2)).toBe(false);
      fillDates(component);
      expect(component.isStepValid(2)).toBe(true);
    });

    it('step 3 (CROWDFUNDING) requires minimumContribution and expectedInvestorNumber', () => {
      fillDetails(component, { investmentPackageType: 'CROWDFUNDING' });
      component.paymentForm.patchValue({ targetAmount: 1000 });
      expect(component.isStepValid(3)).toBe(false);
      fillPayment(component, { targetAmount: 1000, minimumContribution: 100, expectedInvestorNumber: 5 });
      expect(component.isStepValid(3)).toBe(true);
    });

    it('step 3 (LEASING) does not require minimumContribution/expectedInvestorNumber', () => {
      fillDetails(component, { investmentPackageType: 'LEASING' });
      component.paymentForm.patchValue({ targetAmount: 1000 });
      expect(component.isStepValid(3)).toBe(true);
    });
  });

  describe('type-driven payment validators', () => {
    it('clears minimumContribution/expectedInvestorNumber requirements and forces investor count to 1 for non-crowdfunding', () => {
      fillDetails(component, { investmentPackageType: 'BIDDING' });
      expect(component.paymentForm.get('minimumContribution')?.validator).toBeNull();
      expect(component.paymentForm.get('expectedInvestorNumber')?.value).toBe(1);
    });

    it('re-applies required validators when switching back to CROWDFUNDING', () => {
      fillDetails(component, { investmentPackageType: 'BIDDING' });
      fillDetails(component, { investmentPackageType: 'CROWDFUNDING' });
      component.paymentForm.patchValue({ minimumContribution: null });
      component.paymentForm.get('minimumContribution')?.markAsTouched();
      expect(component.paymentForm.get('minimumContribution')?.invalid).toBe(true);
    });
  });

  describe('cross-group targetMustExceedMinimum validator', () => {
    it('flags when target amount does not exceed minimum contribution for CROWDFUNDING', () => {
      fillDetails(component, { investmentPackageType: 'CROWDFUNDING' });
      fillPayment(component, { targetAmount: 100, minimumContribution: 100 });
      expect(component.hasPaymentError('targetMustExceedMinimum')).toBe(false); // not yet touched/dirty
      component.paymentForm.markAsDirty();
      expect(component.hasPaymentError('targetMustExceedMinimum')).toBe(true);
    });

    it('clears once target exceeds minimum', () => {
      fillDetails(component, { investmentPackageType: 'CROWDFUNDING' });
      fillPayment(component, { targetAmount: 1000, minimumContribution: 100 });
      component.paymentForm.markAsDirty();
      expect(component.hasPaymentError('targetMustExceedMinimum')).toBe(false);
    });

    it('does not apply to non-crowdfunding types', () => {
      fillDetails(component, { investmentPackageType: 'LEASING' });
      fillPayment(component, { targetAmount: 100, minimumContribution: 100 });
      component.paymentForm.markAsDirty();
      expect(component.hasPaymentError('targetMustExceedMinimum')).toBe(false);
    });
  });

  describe('endDateAfterDeadline validator', () => {
    it('flags when end date is not after the funding deadline', () => {
      fillDates(component, { endDate: '2026-01-01', fundingDeadline: '2026-03-01T00:00' });
      component.datesForm.markAsDirty();
      expect(component.hasDatesError('endDateAfterDeadline')).toBe(true);
    });

    it('clears when end date is after the funding deadline', () => {
      fillDates(component, { endDate: '2026-06-01', fundingDeadline: '2026-03-01T00:00' });
      component.datesForm.markAsDirty();
      expect(component.hasDatesError('endDateAfterDeadline')).toBe(false);
    });
  });

  describe('getValue', () => {
    it('maps all three step forms into an InvestmentPackageCreateRequest for CROWDFUNDING', () => {
      fillDetails(component, { investmentPackageType: 'CROWDFUNDING' });
      fillDates(component);
      fillPayment(component, { targetAmount: 1000, minimumContribution: 100, expectedInvestorNumber: 5 });

      const value = component.getValue();

      expect(value.farmPlotId).toBe('plot-1');
      expect(value.title).toBe('North Field Package');
      expect(value.investmentPackageType).toBe('CROWDFUNDING');
      expect(value.targetAmount).toBe(1000);
      expect(value.minimumContribution).toBe(100);
      expect(value.expectedInvestorNumber).toBe(5);
      expect(value.fundingDeadline).toBe(new Date('2026-03-01T00:00').toISOString());
    });

    it('defaults minimumContribution to targetAmount and expectedInvestorNumber to 1 for non-crowdfunding', () => {
      fillDetails(component, { investmentPackageType: 'LEASING' });
      fillDates(component);
      component.paymentForm.patchValue({ targetAmount: 2500 });

      const value = component.getValue();

      expect(value.minimumContribution).toBe(2500);
      expect(value.expectedInvestorNumber).toBe(1);
    });
  });

  describe('previewData', () => {
    it('reflects live values across all three step forms', () => {
      fillDetails(component, { investmentPackageType: 'CROWDFUNDING' });
      fillDates(component);
      fillPayment(component, { targetAmount: 1000, minimumContribution: 100, expectedInvestorNumber: 5 });

      const preview = component.previewData;

      expect(preview.title).toBe('North Field Package');
      expect(preview.investmentPackageType).toBe('CROWDFUNDING');
      expect(preview.farmPlotTitle).toBe('North Field');
      expect(preview.startDate).toBe('2026-01-01');
      expect(preview.targetAmount).toBe(1000);
      expect(preview.minimumContribution).toBe(100);
      expect(preview.expectedInvestorNumber).toBe(5);
    });

    it('resolves allowedBankAccountNames from the loaded bank accounts by id', () => {
      component.bankAccounts = [
        { id: 'bank-1', bankName: 'Bank One', accountNumber: '123', accountHolderName: 'Holder' } as any,
        { id: 'bank-2', bankName: 'Bank Two', accountNumber: '456', accountHolderName: 'Holder' } as any,
      ];
      fillPayment(component, { allowedPaymentMethods: ['BANK_TRANSFER'], allowedBankAccountIds: ['bank-2'] });

      expect(component.previewData.allowedBankAccountNames).toEqual(['Bank Two']);
    });

    it('has no farmPlotTitle when no farm plot is selected yet', () => {
      expect(component.previewData.farmPlotTitle).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('reverts all three forms to their defaults', () => {
      fillDetails(component, { title: 'Something' });
      fillDates(component);
      fillPayment(component);

      component.reset();

      expect(component.detailsForm.value.title).toBeFalsy();
      expect(component.detailsForm.value.investmentPackageType).toBe('CROWDFUNDING');
      expect(component.datesForm.value.startDate).toBeFalsy();
      expect(component.paymentForm.value.allowedPaymentMethods).toEqual(['CRYPTO']);
    });
  });
});
