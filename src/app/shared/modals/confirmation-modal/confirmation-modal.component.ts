import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ModalComponent} from "../modal/modal.component";

export type ConfirmationType = 'warning' | 'danger' | 'info' | 'success';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ModalComponent],
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.css']
})
export class ConfirmationModalComponent {
  @Input() visible = false;
  @Input() title = 'Confirmation';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() type: ConfirmationType = 'warning';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() confirmLoading = false;

  @Output() visibleChange = new EventEmitter();
  @Output() confirm = new EventEmitter();
  @Output() cancel = new EventEmitter();

  get iconConfig() {
    const configs = {
      warning: {
        bgColor: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        buttonColor: 'bg-yellow-600 hover:bg-yellow-700 text-white',
        icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
      },
      danger: {
        bgColor: 'bg-red-100',
        iconColor: 'text-red-600',
        buttonColor: 'bg-red-600 hover:bg-red-700 text-white',
        icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      },
      info: {
        bgColor: 'bg-blue-100',
        iconColor: 'text-blue-600',
        buttonColor: 'bg-blue-600 hover:bg-blue-700 text-white',
        icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      },
      success: {
        bgColor: 'bg-green-100',
        iconColor: 'text-green-600',
        buttonColor: 'bg-green-600 hover:bg-green-700 text-white',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      }
    };
    return configs[this.type];
  }

  handleConfirm() {
    this.confirm.emit();
  }

  handleCancel() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cancel.emit();
  }
}
