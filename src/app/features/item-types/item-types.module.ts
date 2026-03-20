import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemTypesRoutingModule } from './item-types-routing.module';
import { ItemTypeListComponent } from './pages/item-type-list/item-type-list.component';
import { SharedModule } from '../../shared/shared.module';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ItemTypeCreateModalComponent } from './modals/item-type-create-modal/item-type-create-modal.component';
import { ItemTypeEditModalComponent } from './modals/item-type-edit-modal/item-type-edit-modal.component';
import { ConfirmationModalComponent } from '../../shared/modals/confirmation-modal/confirmation-modal.component';
import { ItemTypeFilterComponent } from './pages/item-type-filter/item-type-filter.component';

@NgModule({
  declarations: [ItemTypeListComponent],
  imports: [
    CommonModule,
    ItemTypesRoutingModule,
    SharedModule,
    PageHeaderComponent,
    ItemTypeCreateModalComponent,
    ItemTypeEditModalComponent,
    ConfirmationModalComponent,
    ItemTypeFilterComponent,
  ],
  exports: [ItemTypeListComponent],
})
export class ItemTypesModule {}
