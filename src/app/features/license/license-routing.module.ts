import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {
  TrainingProgramListComponent
} from "./training-program/pages/training-program-list/training-program-list.component";
import {
  TrainingProgramEditComponent
} from "./training-program/pages/training-program-edit/training-program-edit.component";
import {
  ClearingAgentApplicantListComponent
} from "./clearing-agent-applicant/pages/clearing-agent-applicant-list/clearing-agent-applicant-list.component";
import {
  ClearingAgentApplicantDetailComponent
} from "./clearing-agent-applicant/pages/clearing-agent-applicant-detail/clearing-agent-applicant-detail.component";

const routes: Routes = [
  {
    path: '',
    component: TrainingProgramListComponent
  },
  {
    path: 'clearing-agent-applicants',
    component: ClearingAgentApplicantListComponent
  },
  {
    path: 'clearing-agent-applicants/:id/detail',
    component: ClearingAgentApplicantDetailComponent
  },
  {
    path: ':id/edit',
    component: TrainingProgramEditComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LicenseRoutingModule {
}

