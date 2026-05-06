import { Component } from '@angular/core';
import { DataTableColumn } from '../../../../shared/data-table/models/data-table-column.model';

interface PreviouslyManagedLeaseFarmPlotRow {
  farmPlotTitle: string;
  leaseStartDate: string;
  leaseEndDate: string;
  leaseStatus: string;
  totalAmount: number;
}

@Component({
  selector: 'app-previously-managed-lease-farm-plots',
  standalone: false,
  templateUrl: './previously-managed-lease-farm-plots.component.html',
})
export class PreviouslyManagedLeaseFarmPlotsComponent {
  readonly rows: PreviouslyManagedLeaseFarmPlotRow[] = [
    {
      farmPlotTitle: 'Akaki Riverside Parcel',
      leaseStartDate: '2025-01-12',
      leaseEndDate: '2025-09-12',
      leaseStatus: 'TERMINATED',
      totalAmount: 98000,
    },
    {
      farmPlotTitle: 'Bole West Demonstration Plot',
      leaseStartDate: '2024-08-01',
      leaseEndDate: '2025-02-01',
      leaseStatus: 'COMPLETED',
      totalAmount: 125000,
    },
    {
      farmPlotTitle: 'Koye South Trial Block',
      leaseStartDate: '2024-03-20',
      leaseEndDate: '2024-11-20',
      leaseStatus: 'COMPLETED',
      totalAmount: 87000,
    },
  ];

  readonly columns: DataTableColumn<PreviouslyManagedLeaseFarmPlotRow>[] = [
    { header: 'Farm Plot', value: (r) => r.farmPlotTitle },
    { header: 'Start', value: (r) => r.leaseStartDate },
    { header: 'End', value: (r) => r.leaseEndDate },
    { header: 'Status', value: (r) => r.leaseStatus },
    { header: 'Amount', value: (r) => this.formatAmount(r.totalAmount) },
  ];

  private formatAmount(value: number): string {
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }
}
