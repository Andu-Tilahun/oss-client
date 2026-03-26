import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule} from '@angular/forms';
import {SharedModule} from '../../shared/shared.module';
import {FarmFollowupsRoutingModule} from './farm-followups-routing.module';
import {FarmFollowUpsComponent} from './pages/farm-followups/farm-followups.component';
import {RestorationPlanCreateModalComponent} from './modals/restoration-plan-create-modal/restoration-plan-create-modal.component';
import {RestorationPlanEditModalComponent} from './modals/restoration-plan-edit-modal/restoration-plan-edit-modal.component';
import {RestorationPlanWorkerUpdateModalComponent} from './modals/restoration-plan-worker-update-modal/restoration-plan-worker-update-modal.component';
import {PageSplitLayoutComponent} from '../../shared/components/page-split-layout/page-split-layout/page-split-layout.component';
import {FilterBarComponent} from '../../shared/components/filter-bar/filter-bar.component';
import {DetailCardComponent} from '../../shared/components/detail-field/detail-card/detail-card.component';
import {DetailSectionComponent} from '../../shared/components/detail-field/detail-section/detail-section.component';
import {DetailFieldComponent} from '../../shared/components/detail-field/detail-field/detail-field.component';

@NgModule({
  declarations: [FarmFollowUpsComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FarmFollowupsRoutingModule,
    SharedModule,
    PageSplitLayoutComponent,
    FilterBarComponent,
    DetailCardComponent,
    DetailSectionComponent,
    DetailFieldComponent,
    RestorationPlanCreateModalComponent,
    RestorationPlanEditModalComponent,
    RestorationPlanWorkerUpdateModalComponent,
  ],
})
export class FarmFollowupsModule {}

