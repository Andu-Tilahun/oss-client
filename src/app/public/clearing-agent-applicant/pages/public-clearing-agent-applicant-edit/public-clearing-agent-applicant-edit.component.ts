import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicClearingAgentApplicantComponent } from '../../public-clearing-agent-applicant.component';

@Component({
  selector: 'app-public-clearing-agent-applicant-edit',
  standalone: true,
  imports: [CommonModule, PublicClearingAgentApplicantComponent],
  templateUrl: './public-clearing-agent-applicant-edit.component.html',
})
export class PublicClearingAgentApplicantEditComponent {}

