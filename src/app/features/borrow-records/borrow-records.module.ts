import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SharedModule } from '../../shared/shared.module';
import { BorrowRecordsRoutingModule } from './borrow-records-routing.module';
import { ReturnsComponent } from './pages/returns/returns.component';
import { ReturnModalComponent } from './modals/return-modal/return-modal.component';
import { BorrowRecordDetailModalComponent } from './modals/borrow-record-detail-modal/borrow-record-detail-modal.component';
import { BorrowRecordsListComponent } from './pages/borrow-records-list/borrow-records-list.component';
import {ReplacementModalComponent} from "../replacement-records/modals/replacement-modal/replacement-modal.component";
import {TransferModalComponent} from "../transfer-records/modals/transfer-modal/transfer-modal.component";

@NgModule({
  declarations: [ReturnsComponent, BorrowRecordsListComponent],
  imports: [
    CommonModule,
    SharedModule,
    PageHeaderComponent,
    BorrowRecordsRoutingModule,
    ReturnModalComponent,
    BorrowRecordDetailModalComponent,
    ReplacementModalComponent,
    TransferModalComponent,
  ],
  exports: [ReturnsComponent, BorrowRecordsListComponent],
})
export class BorrowRecordsModule {}

