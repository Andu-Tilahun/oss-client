import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MultiStepFormModalComponent } from '../../../../shared/modals/multi-step-form-modal/multi-step-form-modal.component';
import { StepConfig } from '../../../../shared/components/stepper/stepper.component';
import { InvestmentPackageCreateWizardComponent } from '../../components/investment-package-create-wizard/investment-package-create-wizard.component';
import { InvestmentPackageCreateRequest } from '../../models/investment-package.model';
import { InvestmentPackageService } from '../../services/investment-package.service';
import { ToastService } from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-investment-package-create-modal',
  standalone: true,
  imports: [CommonModule, MultiStepFormModalComponent, InvestmentPackageCreateWizardComponent],
  templateUrl: './investment-package-create-modal.component.html',
})
export class InvestmentPackageCreateModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() investmentPackageCreated = new EventEmitter<void>();

  @ViewChild('wizard') wizard!: InvestmentPackageCreateWizardComponent;

  currentStep = 1;
  isLoading = false;

  readonly steps: StepConfig[] = [
    { label: 'Details', description: 'Package type, plot & farm details', clickable: true },
    { label: 'Dates', description: 'Start, end & funding deadline', clickable: true },
    { label: 'Payment', description: 'Target, contribution & payment methods', clickable: true },
  ];

  constructor(
    private investmentPackageService: InvestmentPackageService,
    private toastService: ToastService,
  ) {}

  onNext(): void {
    if (this.wizard.isStepValid(this.currentStep)) {
      this.currentStep++;
    } else {
      this.wizard.markStepTouched(this.currentStep);
    }
  }

  onSubmit(): void {
    for (const step of [1, 2, 3]) {
      if (!this.wizard.isStepValid(step)) {
        this.currentStep = step;
        this.wizard.markStepTouched(step);
        return;
      }
    }

    this.isLoading = true;
    const request: InvestmentPackageCreateRequest = this.wizard.getValue();

    this.investmentPackageService.create(request).subscribe({
      next: () => {
        this.isLoading = false;
        this.visible = false;
        this.visibleChange.emit(false);
        this.currentStep = 1;
        this.wizard.reset();
        this.toastService.success('Investment Package created successfully');
        this.investmentPackageCreated.emit();
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err.message || 'Failed to create investment package', 'Create Investment Package');
      },
    });
  }

  onCancelled(): void {
    this.currentStep = 1;
    this.wizard.reset();
  }
}
