import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TransfersComponent } from './pages/transfers/transfers.component';

const routes: Routes = [{ path: '', component: TransfersComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TransferRecordsRoutingModule {}

