import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {ToastService} from '../../../../shared/toast/toast.service';
import {InvestmentPackageService} from '../../services/investment-package.service';
import {InvestmentRecord} from '../../models/investment-package.model';
import {
  AdminInvestmentPackageTypeDecision
} from "../../../investment-package-types/modals/investment-package-type-admin-action-modal/investment-package-type-admin-action-modal.component";
import {FormsModule} from "@angular/forms";

export type InvestorDecision = 'ACCEPTED' | 'REJECTED';

@Component({
  selector: 'app-investment-package-investor-decision-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './investment-package-investor-decision-modal.component.html',
})
export class InvestmentPackageInvestorDecisionModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() decisionSaved = new EventEmitter<void>();
  @Input() investment: InvestmentRecord | null = null;
  isSaving = false;
  isLoading = false;
  decision: AdminInvestmentPackageTypeDecision = 'ACCEPTED';

  constructor(
    private investmentPackageService: InvestmentPackageService,
    private toastService: ToastService,
  ) {
  }

  onSubmit(): void {
    this.decide();
  }

  onCancel(): void {

  }

  decide(): void {
    const id = this.investment?.id;
    if (!id) return;
    this.isSaving = true;
    this.investmentPackageService.investorDecision(id, this.decision).subscribe({
      next: () => {
        this.isSaving = false;
        this.toastService.success(this.decision === 'ACCEPTED' ? 'Investment approved' : 'Investment rejected');
        this.visible = false;
        this.visibleChange.emit(false);
        this.decisionSaved.emit();
      },
      error: (error) => {
        this.isSaving = false;
        this.toastService.error(error.message || 'Failed to save decision', 'Investment Decision');
      },
    });
  }
}

