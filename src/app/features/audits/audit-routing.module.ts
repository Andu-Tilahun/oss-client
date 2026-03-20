import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuditListComponent } from './pages/audit-list/audit-list.component';
import { AuditDetailComponent } from './pages/audit-detail/audit-detail.component';

const routes: Routes = [
  {
    path: '',
    component: AuditListComponent
  },
  {
    path: ':id',
    component: AuditDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuditRoutingModule {
}

