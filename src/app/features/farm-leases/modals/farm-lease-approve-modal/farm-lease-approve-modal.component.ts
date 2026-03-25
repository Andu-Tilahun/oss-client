import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {LeaseAgreement} from '../../models/farm-lease.model';

export type AdminLeaseDecision = 'APPROVE' | 'REJECT';

@Component({
  selector: 'app-farm-lease-approve-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './farm-lease-approve-modal.component.html',
  styleUrls: ['./farm-lease-approve-modal.component.css'],
})
export class FarmLeaseAdminActionModalComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() lease: LeaseAgreement | null = null;

  @Output() decisionSelected = new EventEmitter<AdminLeaseDecision>();

  decision: AdminLeaseDecision = 'APPROVE';

  confirmLoading = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true) {
      this.decision = 'APPROVE';
      this.confirmLoading = false;
    }
  }

  onCancel(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onConfirm(): void {
    if (!this.lease) return;

    this.confirmLoading = true;
    // UI-only for now: you can wire this to a backend endpoint later.
    this.decisionSelected.emit(this.decision);
    this.visible = false;
    this.visibleChange.emit(false);
    this.confirmLoading = false;
  }
}

