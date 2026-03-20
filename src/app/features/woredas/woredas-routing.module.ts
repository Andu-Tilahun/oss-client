import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {WoredaListComponent} from './pages/woreda-list/woreda-list.component';
import {WoredaDetailComponent} from './pages/woreda-detail/woreda-detail.component';

const routes: Routes = [
  {
    path: '',
    component: WoredaListComponent
  },
  {
    path: ':id',
    component: WoredaDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class WoredasRoutingModule {
}

