import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';

@Component({
  selector: 'app-farm-plot-maintenance-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './farm-plot-maintenance-modal.component.html',
})
export class FarmPlotMaintenanceModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() plotTitle = '';
  @Input() confirmLoading = false;

  @Input() reason = '';
  @Output() reasonChange = new EventEmitter<string>();

  @Output() confirm = new EventEmitter<void>();

  get canConfirm(): boolean {
    return !!this.reason && this.reason.trim().length > 0;
  }
}
