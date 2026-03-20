import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuditRoutingModule } from './audit-routing.module';
import { AuditListComponent } from './pages/audit-list/audit-list.component';
import { SharedModule } from '../../shared/shared.module';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@NgModule({
  declarations: [AuditListComponent],
  imports: [
    CommonModule,
    SharedModule,
    AuditRoutingModule,
    PageHeaderComponent
  ]
})
export class AuditModule {
}

