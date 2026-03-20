import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GateLogComponent } from './pages/gate-log/gate-log.component';

const routes: Routes = [{ path: '', component: GateLogComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GateLogsRoutingModule {}

