import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FarmLeasesRoutingModule} from './farm-leases-routing.module';
import {SharedModule} from '../../shared/shared.module';
import {FarmLeaseListComponent} from './pages/farm-lease-list/farm-lease-list.component';
import {FarmLeaseCreateModalComponent} from './modals/farm-lease-create-modal/farm-lease-create-modal.component';
import {FarmLeaseEditModalComponent} from './modals/farm-lease-edit-modal/farm-lease-edit-modal.component';
import {FarmLeaseAdminActionModalComponent} from './modals/farm-lease-admin-action-modal/farm-lease-admin-action-modal.component';
import {PageSplitLayoutComponent} from '../../shared/components/page-split-layout/page-split-layout/page-split-layout.component';
import {FarmLeaseFilterComponent} from './pages/farm-lease-filter/farm-lease-filter.component';
import {FarmLeaseViewComponent} from './components/farm-lease-view/farm-lease-view.component';

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
  ],
})
export class FarmLeasesModule {}

