import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SharedModule} from '../../shared/shared.module';
import {PageHeaderComponent} from '../../shared/components/page-header/page-header.component';
import {FarmFollowupsRoutingModule} from './farm-followups-routing.module';
import {FarmFollowUpListComponent} from './pages/farm-followup-list/farm-followup-list.component';
import {FormsModule} from '@angular/forms';
import {FarmFollowUpCreateModalComponent} from './modals/farm-followup-create-modal/farm-followup-create-modal.component';
import {PageSplitLayoutComponent} from '../../shared/components/page-split-layout/page-split-layout/page-split-layout.component';
import {FarmFollowupsPageComponent} from './pages/farm-followups-page/farm-followups-page.component';
import {FarmFollowUpViewComponent} from './components/farm-followup-view/farm-followup-view.component';
import {FarmFollowUpViewModalComponent} from './modals/farm-followup-view-modal/farm-followup-view-modal.component';
import {FarmFollowUpOutcomeModalComponent} from './modals/farm-followup-outcome-modal/farm-followup-outcome-modal.component';
import {TabsComponent} from '../../shared/tabs/app-tabs/app-tabs.component';
import {RestorationPlanViewComponent} from './components/restoration-plan-view/restoration-plan-view.component';
import {RestorationPlanAssignModalComponent} from './modals/restoration-plan-assign-modal/restoration-plan-assign-modal.component';

@NgModule({
  declarations: [
    FarmFollowUpListComponent,
    FarmFollowupsPageComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    PageHeaderComponent,
    FarmFollowupsRoutingModule,
    FarmFollowUpCreateModalComponent,
    FarmFollowUpViewComponent,
    FarmFollowUpViewModalComponent,
    FarmFollowUpOutcomeModalComponent,
    TabsComponent,
    PageSplitLayoutComponent,
    RestorationPlanViewComponent,
    RestorationPlanAssignModalComponent,
  ],
  exports: [
    FarmFollowUpListComponent
  ]
})
export class FarmFollowupsModule {}

