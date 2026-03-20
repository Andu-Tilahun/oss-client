import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmployeeListComponent } from './pages/employee-list/employee-list.component';
import { EmployeeDetailComponent } from './pages/employee-detail/employee-detail.component';

const routes: Routes = [
  { path: '', component: EmployeeListComponent },
  { path: ':id', component: EmployeeDetailComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EmployeesRoutingModule {}

