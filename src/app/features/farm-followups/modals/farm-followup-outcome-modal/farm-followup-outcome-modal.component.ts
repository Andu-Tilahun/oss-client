import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';

@Component({
  selector: 'app-farm-followup-outcome-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './farm-followup-outcome-modal.component.html',
})
export class FarmFollowUpOutcomeModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() action: 'DONE' | 'EXCLUDED' = 'DONE';
  @Input() followUpReference = '';
  @Input() confirmLoading = false;
  @Input() isAdminActingOnBehalf = false;

  @Input() reason = '';
  @Output() reasonChange = new EventEmitter<string>();

  @Output() confirm = new EventEmitter<void>();

  get title(): string {
    return this.action === 'DONE' ? 'Mark Follow-up as Done' : 'Mark Follow-up as Excluded';
  }

  get confirmText(): string {
    return this.action === 'DONE' ? 'Mark Done' : 'Mark Excluded';
  }

  get confirmButtonClass(): string {
    return this.action === 'DONE'
      ? 'bg-green-600 hover:bg-green-700 text-white'
      : 'bg-red-600 hover:bg-red-700 text-white';
  }

  get canConfirm(): boolean {
    return !!this.reason && this.reason.trim().length > 0;
  }
}
