import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {BranchListComponent} from './pages/branch-list/branch-list.component';
import {BranchDetailComponent} from './pages/branch-detail/branch-detail.component';

const routes: Routes = [
  {
    path: '',
    component: BranchListComponent
  },
  {
    path: ':id',
    component: BranchDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BranchesRoutingModule {
}

