import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {SubcityListComponent} from './pages/subcity-list/subcity-list.component';
import {SubcityDetailComponent} from './pages/subcity-detail/subcity-detail.component';

const routes: Routes = [
  {
    path: '',
    component: SubcityListComponent
  },
  {
    path: ':id',
    component: SubcityDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SubcitiesRoutingModule {
}

