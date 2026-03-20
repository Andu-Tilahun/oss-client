import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {WoredasRoutingModule} from './woredas-routing.module';
import {WoredaListComponent} from './pages/woreda-list/woreda-list.component';
import {SharedModule} from '../../shared/shared.module';
import {PageHeaderComponent} from '../../shared/components/page-header/page-header.component';
import {WoredaCreateModalComponent} from './modals/woreda-create-modal/woreda-create-modal.component';
import {WoredaEditModalComponent} from './modals/woreda-edit-modal/woreda-edit-modal.component';
import {ConfirmationModalComponent} from '../../shared/modals/confirmation-modal/confirmation-modal.component';
import {WoredaFilterComponent} from './pages/woreda-filter/woreda-filter.component';

@NgModule({
  declarations: [WoredaListComponent],
  imports: [
    CommonModule,
    WoredasRoutingModule,
    SharedModule,
    PageHeaderComponent,
    WoredaCreateModalComponent,
    WoredaEditModalComponent,
    ConfirmationModalComponent,
    WoredaFilterComponent
  ]
})
export class WoredasModule {
}

