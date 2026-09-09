import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SystemConfigService } from '../../services/system-config.service';
import { BankAccount } from '../../models/bank-account.model';
import { ToastService } from '../../../../shared/toast/toast.service';
import { PageSplitLayoutComponent } from '../../../../shared/components/page-split-layout/page-split-layout/page-split-layout.component';
import { BankAccountViewComponent } from '../../components/bank-account-view/bank-account-view.component';
import { SharedModule } from '../../../../shared/shared.module';
import { DataTableColumn } from '../../../../shared/data-table/models/data-table-column.model';
import { ColumnType } from '../../../../shared/data-table/models/column-types.model';
import { TableQueryParams } from '../../../../shared/data-table/models/table-query-params.model';
import { PageSplitRightAction } from '../../../../shared/components/page-split-layout/page-split-layout/page-split-right-action.model';
import { BankAccountFilterComponent } from '../../components/bank-account-filter/bank-account-filter.component';

@Component({
  selector: 'app-bank-accounts-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule, PageSplitLayoutComponent, BankAccountViewComponent, BankAccountFilterComponent],
  templateUrl: './bank-accounts-page.component.html',
})
export class BankAccountsPageComponent implements OnInit {
  accounts: BankAccount[] = [];
  allFiltered: BankAccount[] = [];
  displayedAccounts: BankAccount[] = [];
  loading = true;
  showModal = false;
  saving = false;
  togglingId: string | null = null;
  deletingId: string | null = null;
  editingId: string | null = null;
  selectedAccount: BankAccount | null = null;

  searchText = '';
  total = 0;
  pageSize = 10;
  pageIndex = 1;

  form!: FormGroup;

  columns: DataTableColumn<BankAccount>[] = [
    { header: 'Bank Name', value: a => a.bankName, cellClass: 'font-medium text-gray-900' },
    { header: 'Account Number', value: a => a.accountNumber, cellClass: 'font-mono text-xs' },
    { header: 'Account Holder', value: a => a.accountHolderName },
    {
      header: 'Status', columnType: ColumnType.CHECK_BOX,
      defaultValue: a => a.active, disabled: a => this.togglingId === a.id,
      columnAction: a => this.onToggleActive(a),
    },
  ];

  rowActions: PageSplitRightAction<BankAccount>[] = [
    { id: 'edit', icon: 'edit', title: 'Edit', action: a => this.openEdit(a) },
    { id: 'delete', icon: 'delete', title: 'Delete', disabled: a => this.deletingId === a.id, action: a => this.onDelete(a.id) },
  ];

  constructor(
    private fb: FormBuilder,
    private systemConfigService: SystemConfigService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      bankName:          ['', [Validators.required, Validators.maxLength(200)]],
      accountNumber:     ['', [Validators.required, Validators.maxLength(100)]],
      accountHolderName: ['', [Validators.required, Validators.maxLength(200)]],
      branchName:        [''],
      swiftCode:         [''],
      description:       [''],
      active:            [true],
      displayOrder:      [0],
    });
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading = true;
    const previousId = this.selectedAccount?.id;
    this.systemConfigService.getAllBankAccounts().subscribe({
      next: (accounts) => {
        this.accounts = accounts;
        this.loading = false;
        this.applyFilter();
        if (accounts.length === 0) { this.selectedAccount = null; return; }
        const match = accounts.find(a => a.id === previousId);
        this.selectedAccount = match ? { ...match } : { ...accounts[0] };
      },
      error: () => {
        this.toastService.error('Failed to load bank accounts');
        this.loading = false;
      },
    });
  }

  private applyFilter(): void {
    const q = (this.searchText || '').toLowerCase().trim();
    this.allFiltered = q
      ? this.accounts.filter(a =>
          a.bankName.toLowerCase().includes(q) ||
          a.accountNumber.toLowerCase().includes(q) ||
          a.accountHolderName.toLowerCase().includes(q))
      : [...this.accounts];
    this.total = this.allFiltered.length;
    this.updateDisplayedPage();
  }

  private updateDisplayedPage(): void {
    const start = (this.pageIndex - 1) * this.pageSize;
    this.displayedAccounts = this.allFiltered.slice(start, start + this.pageSize);
  }

  onPageChange(params: TableQueryParams): void {
    this.pageIndex = params.pageIndex;
    this.pageSize = params.pageSize;
    this.updateDisplayedPage();
  }

  onSearch(): void {
    this.pageIndex = 1;
    this.applyFilter();
  }

  clearFilters(): void {
    this.searchText = '';
    this.pageIndex = 1;
    this.applyFilter();
  }

  onView(account: BankAccount): void {
    this.selectedAccount = { ...account };
  }

  openCreate(): void {
    this.editingId = null;
    this.form.reset({ active: true, displayOrder: 0 });
    this.showModal = true;
  }

  openEdit(account: BankAccount | null): void {
    if (!account) return;
    this.editingId = account.id;
    this.form.patchValue({
      bankName:          account.bankName,
      accountNumber:     account.accountNumber,
      accountHolderName: account.accountHolderName,
      branchName:        account.branchName ?? '',
      swiftCode:         account.swiftCode ?? '',
      description:       account.description ?? '',
      active:            account.active,
      displayOrder:      account.displayOrder,
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingId = null;
    this.form.reset({ active: true, displayOrder: 0 });
  }

  onSave(): void {
    if (this.saving) {
      return; // a request is already in flight (e.g. Enter pressed again)
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    const request = {
      bankName:          v.bankName,
      accountNumber:     v.accountNumber,
      accountHolderName: v.accountHolderName,
      branchName:        v.branchName || undefined,
      swiftCode:         v.swiftCode || undefined,
      description:       v.description || undefined,
      active:            v.active,
      displayOrder:      v.displayOrder ?? 0,
    };

    this.saving = true;
    const op$ = this.editingId
      ? this.systemConfigService.updateBankAccount(this.editingId, request)
      : this.systemConfigService.createBankAccount(request);

    op$.subscribe({
      next: () => {
        this.saving = false;
        this.toastService.success(this.editingId ? 'Bank account updated' : 'Bank account created');
        this.closeModal();
        this.loadAccounts();
      },
      error: (err) => {
        this.saving = false;
        this.toastService.error(err.message || 'Failed to save bank account');
      },
    });
  }

  onDelete(id: string): void {
    if (this.deletingId) {
      return; // a request is already in flight (e.g. Enter pressed again)
    }
    if (!confirm('Delete this bank account?')) return;
    this.deletingId = id;
    if (this.selectedAccount?.id === id) this.selectedAccount = null;
    this.systemConfigService.deleteBankAccount(id).subscribe({
      next: () => {
        this.deletingId = null;
        this.toastService.success('Bank account deleted');
        this.loadAccounts();
      },
      error: (err) => {
        this.deletingId = null;
        this.toastService.error(err.message || 'Failed to delete bank account');
      },
    });
  }

  onToggleActive(account: BankAccount): void {
    if (this.togglingId) {
      return; // a request is already in flight (e.g. Enter pressed again)
    }
    this.togglingId = account.id;
    const request = {
      bankName:          account.bankName,
      accountNumber:     account.accountNumber,
      accountHolderName: account.accountHolderName,
      branchName:        account.branchName,
      swiftCode:         account.swiftCode,
      description:       account.description,
      active:            !account.active,
      displayOrder:      account.displayOrder,
    };
    this.systemConfigService.updateBankAccount(account.id, request).subscribe({
      next: () => {
        this.togglingId = null;
        this.loadAccounts();
      },
      error: (err) => {
        this.togglingId = null;
        this.toastService.error(err.message || 'Failed to update status');
      },
    });
  }
}
