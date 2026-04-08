import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {FarmFollowUp} from '../../models/farm-followup.model';
import {FarmFollowUpViewComponent} from '../../components/farm-followup-view/farm-followup-view.component';

@Component({
  selector: 'app-farm-followup-view-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, FarmFollowUpViewComponent],
  templateUrl: './farm-followup-view-modal.component.html',
})
export class FarmFollowUpViewModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() followUp: FarmFollowUp | null = null;
}

