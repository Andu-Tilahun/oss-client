import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {RegionListComponent} from './pages/region-list/region-list.component';
import {RegionDetailComponent} from './pages/region-detail/region-detail.component';

const routes: Routes = [
  {
    path: '',
    component: RegionListComponent
  },
  {
    path: ':id',
    component: RegionDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RegionsRoutingModule {
}

