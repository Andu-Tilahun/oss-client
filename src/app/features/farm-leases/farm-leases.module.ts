import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FarmLeasesRoutingModule} from './farm-leases-routing.module';
import {SharedModule} from '../../shared/shared.module';
import {FarmLeaseListComponent} from './pages/farm-lease-list/farm-lease-list.component';
import {FarmLeaseCreateModalComponent} from './modals/farm-lease-create-modal/farm-lease-create-modal.component';
import {FarmLeaseEditModalComponent} from './modals/farm-lease-edit-modal/farm-lease-edit-modal.component';
import {FarmLeaseAdminActionModalComponent} from './modals/farm-lease-approve-modal/farm-lease-approve-modal.component';
import {PageSplitLayoutComponent} from '../../shared/components/page-split-layout/page-split-layout/page-split-layout.component';
import {FarmLeaseFilterComponent} from './pages/farm-lease-filter/farm-lease-filter.component';
import {FarmLeaseViewComponent} from './components/farm-lease-view/farm-lease-view.component';
import {TabsComponent} from "../../shared/tabs/app-tabs/app-tabs.component";
import {FarmPlotViewComponent} from "../farm-plots/components/farm-plot-view/farm-plot-view.component";
import {UserViewComponent} from "../users/components/user-view/user-view.component";
import {FarmFollowupsModule} from "../farm-followups/farm-followups.module";
import {
    ExtensionWorkerAssignModalComponent
} from "../extension-worker-assign-modal/extension-worker-assign-modal.component";
import {ConfirmationModalComponent} from "../../shared/modals/confirmation-modal/confirmation-modal.component";
import {ModalComponent} from "../../shared/modals/modal/modal.component";

@NgModule({
  declarations: [FarmLeaseListComponent],
  imports: [
    CommonModule,
    FarmLeasesRoutingModule,
    SharedModule,
    PageSplitLayoutComponent,
    FarmLeaseFilterComponent,
    FarmLeaseViewComponent,
    FarmLeaseCreateModalComponent,
    FarmLeaseEditModalComponent,
    FarmLeaseAdminActionModalComponent,
    TabsComponent,
    FarmPlotViewComponent,
    UserViewComponent,
    FarmFollowupsModule,
    ExtensionWorkerAssignModalComponent,
    ConfirmationModalComponent,
    ModalComponent,
  ],
})
export class FarmLeasesModule {}

