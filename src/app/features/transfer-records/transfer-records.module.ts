import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { TransferRecordsRoutingModule } from './transfer-records-routing.module';
import { TransfersComponent } from './pages/transfers/transfers.component';
import { TransferModalComponent } from './modals/transfer-modal/transfer-modal.component';

@NgModule({
  declarations: [TransfersComponent],
  imports: [
    CommonModule,
    SharedModule,
    PageHeaderComponent,
    TransferRecordsRoutingModule,
    TransferModalComponent,
  ],
  exports: [TransfersComponent],
})
export class TransferRecordsModule {}

