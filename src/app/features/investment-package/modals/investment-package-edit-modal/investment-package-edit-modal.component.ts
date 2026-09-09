import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MultiStepFormModalComponent } from '../../../../shared/modals/multi-step-form-modal/multi-step-form-modal.component';
import { StepConfig } from '../../../../shared/components/stepper/stepper.component';
import { InvestmentPackageEditWizardComponent } from '../../components/investment-package-edit-wizard/investment-package-edit-wizard.component';
import { InvestmentPackage, InvestmentPackageCreateRequest } from '../../models/investment-package.model';
import { InvestmentPackageService } from '../../services/investment-package.service';
import { ToastService } from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-investment-package-edit-modal',
  standalone: true,
  imports: [CommonModule, MultiStepFormModalComponent, InvestmentPackageEditWizardComponent],
  templateUrl: './investment-package-edit-modal.component.html',
})
export class InvestmentPackageEditModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() investmentPackage: InvestmentPackage | null = null;
  @Output() investmentPackageUpdated = new EventEmitter<void>();

  @ViewChild('wizard') wizard!: InvestmentPackageEditWizardComponent;

  currentStep = 1;
  isLoading = false;

  readonly steps: StepConfig[] = [
    { label: 'Details', description: 'Title, activity & farm details', clickable: true },
    { label: 'Dates', description: 'Start, end & funding deadline', clickable: true },
    { label: 'Payment', description: 'Target, contribution & payment methods', clickable: true },
  ];

  constructor(
    private investmentPackageService: InvestmentPackageService,
    private toastService: ToastService,
  ) {}

  get title(): string {
    switch (this.investmentPackage?.investmentPackageType) {
      case 'LEASING':
        return 'Edit Leasing Investment Package';
      case 'BIDDING':
        return 'Edit Bidding Investment Package';
      case 'CROWDFUNDING':
        return 'Edit Crowdfunding Investment Package';
      default:
        return 'Edit Investment Package';
    }
  }

  onNext(): void {
    if (this.wizard.isStepValid(this.currentStep)) {
      this.currentStep++;
    } else {
      this.wizard.markStepTouched(this.currentStep);
    }
  }

  onSubmit(): void {
    if (this.isLoading) {
      return; // a request is already in flight (e.g. Enter pressed again)
    }
    if (!this.investmentPackage) return;

    for (const step of [1, 2, 3]) {
      if (!this.wizard.isStepValid(step)) {
        this.currentStep = step;
        this.wizard.markStepTouched(step);
        return;
      }
    }

    this.isLoading = true;
    const request: InvestmentPackageCreateRequest = this.wizard.getValue();

    this.investmentPackageService.updateInvestmentPackage(this.investmentPackage.id, request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.currentStep = 1;
        this.toastService.success('Investment Package updated successfully');
        this.investmentPackageUpdated.emit();
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err.message || 'Failed to update investment package', 'Update Investment Package');
      },
    });
  }

  onCancelled(): void {
    this.currentStep = 1;
    this.wizard.reset();
  }
}
