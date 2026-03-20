import {Component, Input, OnInit} from '@angular/core';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {BorrowRecord} from '../../models/borrow-record.model';
import {ColumnType} from "../../../../shared/data-table/models/column-types.model";
import {BorrowRecordService} from "../../services/borrow-record.service";

@Component({
  selector: 'app-borrow-records-list',
  templateUrl: './borrow-records-list.component.html',
})
export class BorrowRecordsListComponent implements OnInit {
  @Input() employeeId = '';
  @Input() records: BorrowRecord[] = [];
  @Input() loading = false;
  @Input() autoLoad = false;
  showReturnModal = false;
  showTransferModal = false;
  showModal = false;
  selected: BorrowRecord | null = null;
  showDetailModal = false;

  constructor(
    private borrowRecordService: BorrowRecordService,
  ) {
  }

  ngOnInit(): void {
    if (this.autoLoad) {
      this.load();
    }
  }

  columns: DataTableColumn<BorrowRecord>[] = [
    {header: 'Item Serial', value: (r) => r.itemSerialNumber ?? '-'},
    {header: 'Item Name', value: (r) => r.itemName ?? r.itemTypeName ?? '-'},
    {header: 'Borrowed At', value: (r) => r.borrowedAt ?? '-'},
    {header: 'Returned At', value: (r) => r.returnedAt ?? '-'},
    {header: 'Condition (Borrow)', value: (r) => r.conditionAtBorrow},
    {header: 'Condition (Return)', value: (r) => r.conditionAtReturn ?? '-'},
    {header: 'Status', value: (r) => r.status},
    {
      header: 'Replace',
      columnType: ColumnType.LINK,
      value: (r) => (r.status === 'Active' ? 'Replace' : ''),
      columnAction: (r) => this.onReplace(r),
    },
    {
      header: 'Transfer',
      columnType: ColumnType.LINK,
      value: (r) => (r.status === 'Active' ? 'Transfer' : ''),
      columnAction: (r) => this.onTransfer(r),
    },
    {
      header: 'Return',
      columnType: ColumnType.LINK,
      value: (r) => (r.status === 'Active' ? 'Return' : ''),
      columnAction: (r) => this.onReturn(r),
    },
  ];

  load(): void {
    this.loading = true;
    const req$ = this.employeeId
      ? this.borrowRecordService.getByEmployeeId(this.employeeId)
      : this.borrowRecordService.getAllActive();

    req$.subscribe({
      next: (list) => {
        this.records = list ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }


  onReplace(r: BorrowRecord): void {
    if (r.status !== 'Active') return;
    this.selected = r;
    this.showModal = true;
  }

  onConfirmed(): void {
    this.showModal = false;
    this.selected = null;
    this.load();
  }

  onTransfer(r: BorrowRecord): void {
    if (r.status !== 'Active') return;
    this.selected = r;
    this.showTransferModal = true;
  }

  onTransferred(): void {
    this.showTransferModal = false;
    this.selected = null;
    this.load();
  }

  onReturn(r: BorrowRecord): void {
    if (r.status !== 'Active') return;
    this.selected = r;
    this.showReturnModal = true;
  }

  onReturned(): void {
    this.showReturnModal = false;
    this.selected = null;
    this.load();
  }

  onView(r: BorrowRecord): void {
    this.selected = r;
    this.showDetailModal = true;
  }
}

