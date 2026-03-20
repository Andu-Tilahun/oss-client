import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FarmLeasesRoutingModule} from './farm-leases-routing.module';
import {SharedModule} from '../../shared/shared.module';
import {PageHeaderComponent} from '../../shared/components/page-header/page-header.component';
import {FarmLeaseListComponent} from './pages/farm-lease-list/farm-lease-list.component';
import {FarmLeaseCreateModalComponent} from './modals/farm-lease-create-modal/farm-lease-create-modal.component';

@NgModule({
  declarations: [FarmLeaseListComponent],
  imports: [
    CommonModule,
    FarmLeasesRoutingModule,
    SharedModule,
    PageHeaderComponent,
    FarmLeaseCreateModalComponent,
  ],
})
export class FarmLeasesModule {}

