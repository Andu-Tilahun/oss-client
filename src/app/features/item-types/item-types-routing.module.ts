import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ItemTypeListComponent } from './pages/item-type-list/item-type-list.component';
import { ItemTypeDetailComponent } from './pages/item-type-detail/item-type-detail.component';

const routes: Routes = [
  { path: '', component: ItemTypeListComponent },
  { path: ':id', component: ItemTypeDetailComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ItemTypesRoutingModule {}
