import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormBuilder } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { BankAccountsPageComponent } from './bank-accounts-page.component';
import { BankAccount } from '../../models/bank-account.model';

const ACTIVE_ACCOUNT: BankAccount = {
  id: 'bank-uuid-1',
  bankName: 'Commercial Bank of Ethiopia',
  accountNumber: '1000123456789',
  accountHolderName: 'ABC Farm Investment PLC',
  active: true,
  displayOrder: 0,
};

const INACTIVE_ACCOUNT: BankAccount = {
  id: 'bank-uuid-2',
  bankName: 'Awash Bank',
  accountNumber: '2000987654321',
  accountHolderName: 'ABC Farm Investment PLC',
  active: false,
  displayOrder: 1,
};

const THIRD_ACCOUNT: BankAccount = {
  id: 'bank-uuid-3',
  bankName: 'Dashen Bank',
  accountNumber: '3000555444333',
  accountHolderName: 'Dashen Holder',
  active: true,
  displayOrder: 2,
};

function makeComponent() {
  const mockService = {
    getAllBankAccounts: vi.fn(() => of([ACTIVE_ACCOUNT, INACTIVE_ACCOUNT])),
    createBankAccount: vi.fn(() => of({ success: true, data: ACTIVE_ACCOUNT })),
    updateBankAccount: vi.fn(() => of({ success: true, data: ACTIVE_ACCOUNT })),
    deleteBankAccount: vi.fn(() => of({ success: true })),
  };
  const mockToastService = { success: vi.fn(), error: vi.fn() };
  const component = new BankAccountsPageComponent(new FormBuilder(), mockService as any, mockToastService as any);
  component.ngOnInit();
  return { component, mockService };
}

describe('BankAccountsPageComponent', () => {
  let component: BankAccountsPageComponent;
  let mockService: ReturnType<typeof makeComponent>['mockService'];

  beforeEach(() => {
    ({ component, mockService } = makeComponent());
  });

  it('should create', () => expect(component).toBeTruthy());

  it('calls getAllBankAccounts on init', () => {
    expect(mockService.getAllBankAccounts).toHaveBeenCalled();
  });

  it('populates accounts and auto-selects the first one', () => {
    expect(component.accounts).toHaveLength(2);
    expect(component.selectedAccount?.id).toBe('bank-uuid-1');
  });

  it('sets loading=false on load failure', () => {
    mockService.getAllBankAccounts.mockReturnValue(throwError(() => new Error('fail')));
    component.loadAccounts();
    expect(component.loading).toBe(false);
  });

  it('openEdit patches the form from the account', () => {
    component.openEdit(ACTIVE_ACCOUNT);
    expect(component.editingId).toBe('bank-uuid-1');
    expect(component.form.get('bankName')?.value).toBe('Commercial Bank of Ethiopia');
    expect(component.form.get('accountNumber')?.value).toBe('1000123456789');
  });

  it('onSave calls updateBankAccount when editingId is set', () => {
    component.openEdit(ACTIVE_ACCOUNT);
    component.form.patchValue({ accountHolderName: 'Updated Holder' });
    component.onSave();
    expect(mockService.updateBankAccount).toHaveBeenCalledWith(
      'bank-uuid-1', expect.objectContaining({ accountHolderName: 'Updated Holder' }),
    );
  });

  it('onSave calls createBankAccount when no editingId is set', () => {
    component.openCreate();
    component.form.patchValue({
      bankName: 'New Bank',
      accountNumber: '111',
      accountHolderName: 'Holder',
    });
    component.onSave();
    expect(mockService.createBankAccount).toHaveBeenCalledWith(
      expect.objectContaining({ bankName: 'New Bank' }),
    );
  });

  it('onDelete calls deleteBankAccount after confirm', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.onDelete('bank-uuid-1');
    expect(mockService.deleteBankAccount).toHaveBeenCalledWith('bank-uuid-1');
  });

  it('onDelete does nothing when confirm is declined', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    component.onDelete('bank-uuid-1');
    expect(mockService.deleteBankAccount).not.toHaveBeenCalled();
  });

  describe('table columns config', () => {
    it('Status checkbox column reflects account active state per row', () => {
      const statusColumn = component.columns.find(c => c.header === 'Status')!;
      const defaultValue = statusColumn.defaultValue as (item: BankAccount) => boolean;
      expect(defaultValue(ACTIVE_ACCOUNT)).toBe(true);
      expect(defaultValue(INACTIVE_ACCOUNT)).toBe(false);
    });

    it('Status checkbox column calls onToggleActive on change', () => {
      const toggleSpy = vi.spyOn(component, 'onToggleActive').mockImplementation(() => undefined);
      const statusColumn = component.columns.find(c => c.header === 'Status')!;
      statusColumn.columnAction!(ACTIVE_ACCOUNT);
      expect(toggleSpy).toHaveBeenCalledWith(ACTIVE_ACCOUNT);
    });

    it('Status column is disabled while that account is toggling', () => {
      component.togglingId = 'bank-uuid-1';
      const statusColumn = component.columns.find(c => c.header === 'Status')!;
      const disabled = statusColumn.disabled as (item: BankAccount) => boolean;
      expect(disabled(ACTIVE_ACCOUNT)).toBe(true);
      expect(disabled(INACTIVE_ACCOUNT)).toBe(false);
    });

    it('onToggleActive flips active via updateBankAccount and clears togglingId', () => {
      component.onToggleActive(ACTIVE_ACCOUNT);
      expect(mockService.updateBankAccount).toHaveBeenCalledWith(
        'bank-uuid-1', expect.objectContaining({ active: false }),
      );
      expect(component.togglingId).toBeNull();
    });

    it('rowActions edit/delete call the right handlers', () => {
      const editAction = component.rowActions.find(a => a.id === 'edit')!;
      const openEditSpy = vi.spyOn(component, 'openEdit');
      editAction.action(ACTIVE_ACCOUNT);
      expect(openEditSpy).toHaveBeenCalledWith(ACTIVE_ACCOUNT);

      const deleteAction = component.rowActions.find(a => a.id === 'delete')!;
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      deleteAction.action(ACTIVE_ACCOUNT);
      expect(mockService.deleteBankAccount).toHaveBeenCalledWith('bank-uuid-1');
    });
  });

  describe('search, filter and pagination', () => {
    it('onSearch filters displayedAccounts by bank name and resets to page 1', () => {
      component.pageIndex = 2;
      component.searchText = 'awash';
      component.onSearch();
      expect(component.pageIndex).toBe(1);
      expect(component.displayedAccounts).toEqual([INACTIVE_ACCOUNT]);
      expect(component.total).toBe(1);
    });

    it('onSearch filters by account number', () => {
      component.searchText = '2000987654321';
      component.onSearch();
      expect(component.displayedAccounts).toEqual([INACTIVE_ACCOUNT]);
    });

    it('onSearch filters by account holder name', () => {
      component.searchText = 'ABC Farm Investment PLC';
      component.onSearch();
      expect(component.displayedAccounts).toHaveLength(2);
    });

    it('clearFilters clears searchText and restores the full list', () => {
      component.searchText = 'awash';
      component.onSearch();
      component.clearFilters();
      expect(component.searchText).toBe('');
      expect(component.displayedAccounts).toHaveLength(2);
      expect(component.total).toBe(2);
    });

    it('onPageChange updates paging state and re-slices displayedAccounts', () => {
      mockService.getAllBankAccounts.mockReturnValue(of([ACTIVE_ACCOUNT, INACTIVE_ACCOUNT, THIRD_ACCOUNT]));
      component.loadAccounts();

      component.onPageChange({ pageIndex: 2, pageSize: 1 });
      expect(component.pageIndex).toBe(2);
      expect(component.pageSize).toBe(1);
      expect(component.displayedAccounts).toEqual([INACTIVE_ACCOUNT]);

      component.onPageChange({ pageIndex: 3, pageSize: 1 });
      expect(component.displayedAccounts).toEqual([THIRD_ACCOUNT]);
    });

    it('loadAccounts auto-selects from the full accounts list, not just the current page', () => {
      mockService.getAllBankAccounts.mockReturnValue(of([ACTIVE_ACCOUNT, INACTIVE_ACCOUNT, THIRD_ACCOUNT]));
      component.pageSize = 1;
      component.loadAccounts();

      expect(component.accounts).toHaveLength(3);
      expect(component.displayedAccounts).toEqual([ACTIVE_ACCOUNT]);
      expect(component.selectedAccount?.id).toBe('bank-uuid-1');
    });
  });
});
