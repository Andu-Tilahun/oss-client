import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ItemListComponent } from './pages/item-list/item-list.component';
import { ItemDetailComponent } from './pages/item-detail/item-detail.component';

const routes: Routes = [
  { path: '', component: ItemListComponent },
  { path: ':id', component: ItemDetailComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ItemsRoutingModule {}
