import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableColumn } from '../../../../shared/data-table/models/data-table-column.model';
import { BorrowRecord } from '../../models/borrow-record.model';
import { BorrowRecordService } from '../../services/borrow-record.service';
import { AuthService } from '../../../auth/services/auth.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SharedModule } from '../../../../shared/shared.module';
import {BorrowRecordsModule} from "../../borrow-records.module";

@Component({
  selector: 'app-my-borrows',
  standalone: true,
  imports: [CommonModule, SharedModule, PageHeaderComponent, BorrowRecordsModule],
  templateUrl: './my-borrows.component.html',
})
export class MyBorrowsComponent implements OnInit {
  records: BorrowRecord[] = [];
  loading = false;
  notLinked = false;

  columns: DataTableColumn<BorrowRecord>[] = [
    { header: 'Item Serial', value: (r) => r.itemSerialNumber ?? '-' },
    { header: 'Item Name', value: (r) => r.itemName ?? r.itemTypeName ?? '-' },
    { header: 'Borrowed At', value: (r) => r.borrowedAt ?? '-' },
    { header: 'Returned At', value: (r) => r.returnedAt ?? '-' },
    { header: 'Condition (Borrow)', value: (r) => r.conditionAtBorrow },
    { header: 'Condition (Return)', value: (r) => r.conditionAtReturn ?? '-' },
    { header: 'Status', value: (r) => r.status },
  ];

  constructor(
    private borrowRecordService: BorrowRecordService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    const user = this.authService.getCurrentUser();
    const employeeId = user?.employeeId;
    if (!employeeId) {
      this.notLinked = true;
      this.loading = false;
      return;
    }
    this.notLinked = false;
    this.loading = true;
    this.borrowRecordService.getByEmployeeId(employeeId).subscribe({
      next: (list) => {
        this.records = list ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
