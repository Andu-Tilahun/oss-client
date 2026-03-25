import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {ToastService} from '../../../../shared/toast/toast.service';
import {FarmCrowdfundingService} from '../../services/farm-crowdfunding.service';
import {InvestmentRecord} from '../../models/farm-crowdfunding.model';

export type InvestorDecision = 'ACCEPT' | 'REJECT';

@Component({
  selector: 'app-farm-crowdfunding-investor-decision-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './farm-crowdfunding-investor-decision-modal.component.html',
})
export class FarmCrowdfundingInvestorDecisionModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() decisionSaved = new EventEmitter<void>();

  @Input() investment: InvestmentRecord | null = null;

  isSaving = false;

  constructor(
    private crowdfundingService: FarmCrowdfundingService,
    private toastService: ToastService,
  ) {}

  decide(decision: InvestorDecision): void {
    const id = this.investment?.id;
    if (!id) return;
    this.isSaving = true;
    this.crowdfundingService.investorDecision(id, decision).subscribe({
      next: () => {
        this.isSaving = false;
        this.toastService.success(decision === 'ACCEPT' ? 'Investment approved' : 'Investment rejected');
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

