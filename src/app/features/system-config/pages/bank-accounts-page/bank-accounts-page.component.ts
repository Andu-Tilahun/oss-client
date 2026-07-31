import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SystemConfigService } from '../../services/system-config.service';
import { BankAccount } from '../../models/bank-account.model';
import { ToastService } from '../../../../shared/toast/toast.service';
import { PageSplitLayoutComponent } from '../../../../shared/components/page-split-layout/page-split-layout/page-split-layout.component';
import { BankAccountViewComponent } from '../../components/bank-account-view/bank-account-view.component';

@Component({
  selector: 'app-bank-accounts-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageSplitLayoutComponent, BankAccountViewComponent],
  templateUrl: './bank-accounts-page.component.html',
})
export class BankAccountsPageComponent implements OnInit {
  accounts: BankAccount[] = [];
  loading = true;
  showModal = false;
  saving = false;
  deletingId: string | null = null;
  editingId: string | null = null;
  selectedAccount: BankAccount | null = null;

  form!: FormGroup;

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
      next: () => this.loadAccounts(),
      error: (err) => this.toastService.error(err.message || 'Failed to update status'),
    });
  }
}
