import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {OrganizationListComponent} from './pages/organization-list/organization-list.component';
import {OrganizationDetailComponent} from './pages/organization-detail/organization-detail.component';

const routes: Routes = [
  {
    path: '',
    component: OrganizationListComponent
  },
  {
    path: ':id',
    component: OrganizationDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrganizationsRoutingModule {
}

