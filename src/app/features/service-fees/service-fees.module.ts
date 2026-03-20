import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {ServiceFeesRoutingModule} from './service-fees-routing.module';
import {SharedModule} from '../../shared/shared.module';
import {PageHeaderComponent} from '../../shared/components/page-header/page-header.component';
import {ConfirmationModalComponent} from '../../shared/modals/confirmation-modal/confirmation-modal.component';

import {ServiceFeeListComponent} from './pages/service-fee-list/service-fee-list.component';
import {ServiceFeeFilterComponent} from './pages/service-fee-filter/service-fee-filter.component';
import {ServiceFeeCreateModalComponent} from './modals/service-fee-create-modal/service-fee-create-modal.component';
import {ServiceFeeEditModalComponent} from './modals/service-fee-edit-modal/service-fee-edit-modal.component';

@NgModule({
  declarations: [ServiceFeeListComponent],
  imports: [
    CommonModule,
    ServiceFeesRoutingModule,
    SharedModule,
    PageHeaderComponent,
    ConfirmationModalComponent,
    ServiceFeeFilterComponent,
    ServiceFeeCreateModalComponent,
    ServiceFeeEditModalComponent,
  ]
})
export class ServiceFeesModule {
}

