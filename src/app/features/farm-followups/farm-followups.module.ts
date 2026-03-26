import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {FarmFollowupsRoutingModule} from './farm-followups-routing.module';
import {FarmFollowUpsComponent} from './pages/farm-followups/farm-followups.component';
import {RestorationPlanCreateModalComponent} from './modals/restoration-plan-create-modal/restoration-plan-create-modal.component';
import {RestorationPlanEditModalComponent} from './modals/restoration-plan-edit-modal/restoration-plan-edit-modal.component';
import {RestorationPlanWorkerUpdateModalComponent} from './modals/restoration-plan-worker-update-modal/restoration-plan-worker-update-modal.component';

@NgModule({
  declarations: [FarmFollowUpsComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FarmFollowupsRoutingModule,
    RestorationPlanCreateModalComponent,
    RestorationPlanEditModalComponent,
    RestorationPlanWorkerUpdateModalComponent,
  ],
})
export class FarmFollowupsModule {}

