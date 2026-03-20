import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemsRoutingModule } from './items-routing.module';
import { ItemListComponent } from './pages/item-list/item-list.component';
import { SharedModule } from '../../shared/shared.module';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ItemCreateModalComponent } from './modals/item-create-modal/item-create-modal.component';
import { ItemEditModalComponent } from './modals/item-edit-modal/item-edit-modal.component';
import { ItemFilterComponent } from './pages/item-filter/item-filter.component';

@NgModule({
  declarations: [ItemListComponent],
  imports: [
    CommonModule,
    ItemsRoutingModule,
    SharedModule,
    PageHeaderComponent,
    ItemCreateModalComponent,
    ItemEditModalComponent,
    ItemFilterComponent,
  ],
  exports: [ItemListComponent],
})
export class ItemsModule {}
