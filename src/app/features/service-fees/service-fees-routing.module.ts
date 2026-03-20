import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ServiceFeeListComponent} from './pages/service-fee-list/service-fee-list.component';
import {ServiceFeeDetailComponent} from './pages/service-fee-detail/service-fee-detail.component';

const routes: Routes = [
  {
    path: '',
    component: ServiceFeeListComponent
  },
  {
    path: ':id',
    component: ServiceFeeDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ServiceFeesRoutingModule {
}

