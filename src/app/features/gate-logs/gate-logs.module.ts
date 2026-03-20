import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { GateLogsRoutingModule } from './gate-logs-routing.module';
import { GateLogComponent } from './pages/gate-log/gate-log.component';
import { GateScanFormComponent } from './components/gate-scan-form/gate-scan-form.component';

@NgModule({
  declarations: [GateLogComponent],
  imports: [
    CommonModule,
    SharedModule,
    PageHeaderComponent,
    GateLogsRoutingModule,
    GateScanFormComponent,
  ],
  exports: [GateLogComponent],
})
export class GateLogsModule {}

