import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';

@Component({
  selector: 'app-investment-package-type-close-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './investment-package-type-close-modal.component.html',
})
export class InvestmentPackageTypeCloseModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() title = 'Close Investment Package';
  @Input() packageTitle = '';
  @Input() confirmLoading = false;

  @Input() reason = '';
  @Output() reasonChange = new EventEmitter<string>();

  @Output() confirm = new EventEmitter<void>();

  get canConfirm(): boolean {
    return !!this.reason && this.reason.trim().length > 0;
  }
}
