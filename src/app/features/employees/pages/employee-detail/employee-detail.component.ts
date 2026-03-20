import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {BorrowRecord} from '../../../borrow-records/models/borrow-record.model';
import {BorrowRecordService} from '../../../borrow-records/services/borrow-record.service';
import {Item} from '../../../items/models/item.model';

@Component({
  selector: 'app-employee-detail',
  templateUrl: './employee-detail.component.html',
})
export class EmployeeDetailComponent implements OnInit {
  employeeId = '';

  showBorrowModal = false;
  availableItems: Item[] = [];

  borrowRecords: BorrowRecord[] = [];

  constructor(
    private route: ActivatedRoute,
    private borrowRecordService: BorrowRecordService,
  ) {
  }

  ngOnInit(): void {
    this.employeeId = this.route.snapshot.paramMap.get('id') || '';
    this.loadBorrowRecords();
  }

  openBorrowModal(): void {
    this.showBorrowModal = true;
  }

  onBorrowCreated(): void {
    this.loadBorrowRecords();
  }

  private loadBorrowRecords(): void {
    if (!this.employeeId) return;
    this.borrowRecordService.getByEmployeeId(this.employeeId).subscribe({
      next: (list) => {
        this.borrowRecords = list ?? [];
      },
      error: () => {
        this.borrowRecords = [];
      },
    });
  }
}

