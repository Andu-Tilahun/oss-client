import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';

@Component({
  selector: 'app-investment-package-choose-winner-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './investment-package-choose-winner-modal.component.html',
})
export class InvestmentPackageChooseWinnerModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() title = 'Confirm Winning Investor';
  @Input() candidateNames: string[] = [];
  @Input() isChange = false;
  @Input() confirmLoading = false;

  @Input() remark = '';
  @Output() remarkChange = new EventEmitter<string>();

  @Output() confirm = new EventEmitter<void>();

  get canConfirm(): boolean {
    return !!this.remark && this.remark.trim().length > 0;
  }
}
