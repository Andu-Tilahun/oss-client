import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FarmFollowUp} from '../../models/farm-followup.model';
import {DetailCardComponent} from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import {DetailSectionComponent} from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import {DetailFieldComponent} from '../../../../shared/components/detail-field/detail-field/detail-field.component';

@Component({
  selector: 'app-farm-followup-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './farm-followup-view.component.html',
})
export class FarmFollowUpViewComponent {
  @Input() followUp: FarmFollowUp | null = null;
}

