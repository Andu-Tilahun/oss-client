import { Component, OnInit, ViewChild } from '@angular/core';
import { DataTableColumn } from '../../../../shared/data-table/models/data-table-column.model';
import { GateLogService } from '../../services/gate-log.service';
import { GateLog } from '../../models/gate-log.model';
import { ToastService } from '../../../../shared/toast/toast.service';
import { GateScanFormComponent } from '../../components/gate-scan-form/gate-scan-form.component';

@Component({
  selector: 'app-gate-log',
  templateUrl: './gate-log.component.html',
})
export class GateLogComponent implements OnInit {
  logs: GateLog[] = [];
  loading = false;

  @ViewChild(GateScanFormComponent) scanForm?: GateScanFormComponent;

  columns: DataTableColumn<GateLog>[] = [
    { header: 'Employee', value: (l) => `${l.employeeCode ?? ''} ${l.employeeName ?? ''}`.trim() || l.employeeId },
    { header: 'Item Serial', value: (l) => l.itemSerialNumber ?? l.itemId },
    { header: 'Scan Type', value: (l) => l.scanType },
    { header: 'Check-In At', value: (l) => l.scannedCheckinAt ?? '-' },
    { header: 'Check-Out At', value: (l) => l.scannedCheckoutAt ?? '-' },
    { header: 'Scanned By', value: (l) => l.scannedBy ?? '-' },
    { header: 'Created At', value: (l) => l.createdAt ?? '-' },
  ];

  constructor(
    private gateLogService: GateLogService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.gateLogService.list().subscribe({
      next: (list) => {
        this.logs = list ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toastService.error(err.message || 'Failed to load gate logs', 'Gate Logs');
      },
    });
  }

  onScan(): void {
    if (!this.scanForm) return;
    if (!this.scanForm.isValid()) {
      this.scanForm.markAllAsTouched();
      this.toastService.error('Provide exactly one of Employee ID or Item ID', 'Gate Scan');
      return;
    }

    this.gateLogService
      .scan(this.scanForm.getValue())
      .subscribe({
        next: (log) => {
          this.toastService.success(`Scan recorded: ${log.scanType}`);
          this.scanForm?.resetIds();
          this.load();
        },
        error: (err) => this.toastService.error(err.message || 'Failed to scan', 'Gate Scan'),
      });
  }
}

