import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from "../modal/modal.component";

export type InfoType = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-info-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './info-modal.component.html',
  styleUrls: ['./info-modal.component.css']
})
export class InfoModalComponent {
  @Input() visible = false;
  @Input() title = 'Information';
  @Input() message = '';
  @Input() type: InfoType = 'info';
  @Input() buttonText = 'OK';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() close = new EventEmitter<void>();

  get config() {
    const configs = {
      info: {
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        titleColor: 'text-blue-900',
        icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      },
      success: {
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        titleColor: 'text-green-900',
        icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      },
      warning: {
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        titleColor: 'text-yellow-900',
        icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
      },
      error: {
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        titleColor: 'text-red-900',
        icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
      }
    };
    return configs[this.type];
  }

  handleClose() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.close.emit();
  }
}
