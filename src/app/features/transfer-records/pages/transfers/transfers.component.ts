import {Component, OnInit} from '@angular/core';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {BorrowRecord} from '../../../borrow-records/models/borrow-record.model';
import {BorrowRecordService} from '../../../borrow-records/services/borrow-record.service';
import {ToastService} from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-transfers',
  templateUrl: './transfers.component.html',
})
export class TransfersComponent implements OnInit {
  records: BorrowRecord[] = [];
  loading = false;

  selected: BorrowRecord | null = null;

  columns: DataTableColumn<BorrowRecord>[] = [
    {header: 'Employee', value: (r) => `${r.employeeCode ?? ''} ${r.employeeName ?? ''}`.trim() || r.employeeId},
    {header: 'Item Serial', value: (r) => r.itemSerialNumber ?? r.itemId},
    {header: 'Item Name', value: (r) => r.itemName ?? r.itemTypeName ?? '-'},
    {header: 'Borrowed At', value: (r) => r.borrowedAt ?? '-'},
    {header: 'Status', value: (r) => r.status},
  ];

  constructor(
    private borrowRecordService: BorrowRecordService,
    private toastService: ToastService
  ) {
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.borrowRecordService.getAllActive().subscribe({
      next: (list: BorrowRecord[]) => {
        this.records = list ?? [];
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.toastService.error(err.message || 'Failed to load active borrows', 'Transfers');
      },
    });
  }
}

