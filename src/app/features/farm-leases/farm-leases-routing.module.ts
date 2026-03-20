import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {FarmLeaseListComponent} from './pages/farm-lease-list/farm-lease-list.component';

const routes: Routes = [
  {
    path: '',
    component: FarmLeaseListComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FarmLeasesRoutingModule {}

