import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {SubcitiesRoutingModule} from './subcities-routing.module';
import {SubcityListComponent} from './pages/subcity-list/subcity-list.component';
import {SharedModule} from '../../shared/shared.module';
import {PageHeaderComponent} from '../../shared/components/page-header/page-header.component';
import {SubcityCreateModalComponent} from './modals/subcity-create-modal/subcity-create-modal.component';
import {SubcityEditModalComponent} from './modals/subcity-edit-modal/subcity-edit-modal.component';
import {ConfirmationModalComponent} from '../../shared/modals/confirmation-modal/confirmation-modal.component';
import {SubcityFilterComponent} from './pages/subcity-filter/subcity-filter.component';

@NgModule({
  declarations: [SubcityListComponent],
  imports: [
    CommonModule,
    SubcitiesRoutingModule,
    SharedModule,
    PageHeaderComponent,
    SubcityCreateModalComponent,
    SubcityEditModalComponent,
    ConfirmationModalComponent,
    SubcityFilterComponent
  ]
})
export class SubcitiesModule {
}

