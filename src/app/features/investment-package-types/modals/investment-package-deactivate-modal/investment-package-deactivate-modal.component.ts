import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';

@Component({
  selector: 'app-investment-package-deactivate-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './investment-package-deactivate-modal.component.html',
})
export class InvestmentPackageDeactivateModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() title = 'Deactivate Investment Option';
  @Input() packageTitle = '';
  @Input() confirmLoading = false;

  @Input() reason = '';
  @Output() reasonChange = new EventEmitter<string>();

  @Output() confirm = new EventEmitter<void>();

  get canConfirm(): boolean {
    return !!this.reason && this.reason.trim().length > 0;
  }
}
