import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {InvestmentPackageTypeAgreement} from '../../models/investment-package-type.model';

export type AdminInvestmentPackageTypeDecision = 'ACCEPTED' | 'REJECTED';

@Component({
  selector: 'app-investment-package-type-admin-action-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './investment-package-type-admin-action-modal.component.html',
  styleUrls: ['./investment-package-type-admin-action-modal.component.css'],
})
export class InvestmentPackageTypeAdminActionModalComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() agreement: InvestmentPackageTypeAgreement | null = null;

  @Output() decisionSelected = new EventEmitter<AdminInvestmentPackageTypeDecision>();

  decision: AdminInvestmentPackageTypeDecision = 'ACCEPTED';

  confirmLoading = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.decision = 'ACCEPTED';
      this.confirmLoading = false;
    }
  }

  onCancel(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onConfirm(): void {
    if (!this.agreement) return;

    this.confirmLoading = true;
    this.decisionSelected.emit(this.decision);
    this.visible = false;
    this.visibleChange.emit(false);
    this.confirmLoading = false;
  }
}
