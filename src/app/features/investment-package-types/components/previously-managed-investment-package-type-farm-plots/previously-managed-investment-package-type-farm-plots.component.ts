import { Component } from '@angular/core';
import { DataTableColumn } from '../../../../shared/data-table/models/data-table-column.model';

interface PreviouslyManagedInvestmentPackageTypeFarmPlotRow {
  farmPlotTitle: string;
  packageTypeStartDate: string;
  packageTypeEndDate: string;
  packageTypeStatus: string;
  totalAmount: number;
}

@Component({
  selector: 'app-previously-managed-investment-package-type-farm-plots',
  standalone: false,
  templateUrl: './previously-managed-investment-package-type-farm-plots.component.html',
})
export class PreviouslyManagedInvestmentPackageTypeFarmPlotsComponent {
  readonly rows: PreviouslyManagedInvestmentPackageTypeFarmPlotRow[] = [
    {
      farmPlotTitle: 'Akaki Riverside Parcel',
      packageTypeStartDate: '2025-01-12',
      packageTypeEndDate: '2025-09-12',
      packageTypeStatus: 'TERMINATED',
      totalAmount: 98000,
    },
    {
      farmPlotTitle: 'Bole West Demonstration Plot',
      packageTypeStartDate: '2024-08-01',
      packageTypeEndDate: '2025-02-01',
      packageTypeStatus: 'COMPLETED',
      totalAmount: 125000,
    },
    {
      farmPlotTitle: 'Koye South Trial Block',
      packageTypeStartDate: '2024-03-20',
      packageTypeEndDate: '2024-11-20',
      packageTypeStatus: 'COMPLETED',
      totalAmount: 87000,
    },
  ];

  readonly columns: DataTableColumn<PreviouslyManagedInvestmentPackageTypeFarmPlotRow>[] = [
    { header: 'Farm Plot', value: (r) => r.farmPlotTitle },
    { header: 'Start', value: (r) => r.packageTypeStartDate },
    { header: 'End', value: (r) => r.packageTypeEndDate },
    { header: 'Status', value: (r) => r.packageTypeStatus },
    { header: 'Amount', value: (r) => this.formatAmount(r.totalAmount) },
  ];

  private formatAmount(value: number): string {
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }
}
