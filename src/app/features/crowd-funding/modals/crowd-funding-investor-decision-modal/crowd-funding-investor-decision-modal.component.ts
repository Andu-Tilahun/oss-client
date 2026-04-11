import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {ToastService} from '../../../../shared/toast/toast.service';
import {CrowdFundingService} from '../../services/crowd-funding.service';
import {InvestmentRecord} from '../../models/crowd-funding.model';
import {
  AdminLeaseDecision
} from "../../../farm-leases/modals/farm-lease-approve-modal/farm-lease-approve-modal.component";
import {FormsModule} from "@angular/forms";

export type InvestorDecision = 'ACCEPTED' | 'REJECTED';

@Component({
  selector: 'app-crowd-funding-investor-decision-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './crowd-funding-investor-decision-modal.component.html',
})
export class CrowdFundingInvestorDecisionModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() decisionSaved = new EventEmitter<void>();
  @Input() investment: InvestmentRecord | null = null;
  isSaving = false;
  isLoading = false;
  decision: AdminLeaseDecision = 'ACCEPTED';

  constructor(
    private crowdfundingService: CrowdFundingService,
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
    this.crowdfundingService.investorDecision(id, this.decision).subscribe({
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

