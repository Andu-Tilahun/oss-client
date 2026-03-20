import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DepartmentListComponent } from './pages/department-list/department-list.component';
import { DepartmentDetailComponent } from './pages/department-detail/department-detail.component';

const routes: Routes = [
  { path: '', component: DepartmentListComponent },
  { path: ':id', component: DepartmentDetailComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DepartmentsRoutingModule {}
