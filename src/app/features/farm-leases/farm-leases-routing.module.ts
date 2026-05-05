import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {FarmLeaseListComponent} from './pages/farm-lease-list/farm-lease-list.component';
import {FarmLeasePlotDetailComponent} from './pages/farm-lease-plot-detail/farm-lease-plot-detail.component';
import {FarmLeaseMobileDetailComponent} from './pages/farm-lease-mobile-detail/farm-lease-mobile-detail.component';

const routes: Routes = [
  {
    path: '',
    component: FarmLeaseListComponent,
  },
  {
    path: 'plot/:id',
    component: FarmLeasePlotDetailComponent,
  },
  {
    path: 'lease/:id',
    component: FarmLeaseMobileDetailComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FarmLeasesRoutingModule {}

