import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import {
  TrainingProgramListComponent
} from "./training-program/pages/training-program-list/training-program-list.component";
import {LicenseRoutingModule} from "./license-routing.module";
import {
  TrainingProgramFilterComponent
} from "./training-program/pages/training-program-filter/training-program-filter.component";
import {
  TrainingProgramCreateModalComponent
} from "./training-program/modals/training-program-create-modal/training-program-create-modal.component";
import {UserRequestListComponent} from "../../shared/user-request/pages/user-request-list/user-request-list.component";
import {
  ClearingAgentApplicantListComponent
} from "./clearing-agent-applicant/pages/clearing-agent-applicant-list/clearing-agent-applicant-list.component";
import {
  ClearingAgentApplicantFilterComponent
} from "./clearing-agent-applicant/pages/clearing-agent-applicant-filter/clearing-agent-applicant-filter.component";

@NgModule({
  declarations: [TrainingProgramListComponent, ClearingAgentApplicantListComponent],
    imports: [
        CommonModule,
        FormsModule,
        SharedModule,
        LicenseRoutingModule,
        PageHeaderComponent,
        TrainingProgramFilterComponent,
        TrainingProgramCreateModalComponent,
        UserRequestListComponent,
        ClearingAgentApplicantFilterComponent
    ]
})
export class LicenseModule {
}

