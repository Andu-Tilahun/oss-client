import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {RegionsRoutingModule} from './regions-routing.module';
import {RegionListComponent} from './pages/region-list/region-list.component';
import {SharedModule} from '../../shared/shared.module';
import {PageHeaderComponent} from '../../shared/components/page-header/page-header.component';
import {RegionCreateModalComponent} from './modals/region-create-modal/region-create-modal.component';
import {RegionEditModalComponent} from './modals/region-edit-modal/region-edit-modal.component';
import {ConfirmationModalComponent} from '../../shared/modals/confirmation-modal/confirmation-modal.component';
import {RegionFilterComponent} from './pages/region-filter/region-filter.component';

@NgModule({
  declarations: [RegionListComponent],
  imports: [
    CommonModule,
    RegionsRoutingModule,
    SharedModule,
    PageHeaderComponent,
    RegionCreateModalComponent,
    RegionEditModalComponent,
    ConfirmationModalComponent,
    RegionFilterComponent
  ]
})
export class RegionsModule {
}

