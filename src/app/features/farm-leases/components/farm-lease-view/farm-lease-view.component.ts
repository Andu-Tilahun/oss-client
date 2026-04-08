import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LeaseAgreement, LeaseStatus, LeaseTerm} from '../../models/farm-lease.model';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {SharedModule} from '../../../../shared/shared.module';
import {FarmLeaseService} from '../../services/farm-lease.service';
import {DetailCardComponent} from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import {
  DetailSectionComponent
} from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import {DetailFieldComponent} from '../../../../shared/components/detail-field/detail-field/detail-field.component';
import {FarmPlotViewComponent} from "../../../farm-plots/components/farm-plot-view/farm-plot-view.component";
import {UserViewComponent} from "../../../users/components/user-view/user-view.component";
import {FarmFollowupsModule} from "../../../farm-followups/farm-followups.module";

@Component({
  selector: 'app-farm-lease-view',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    DetailCardComponent,
    DetailSectionComponent,
    DetailFieldComponent,
    FarmPlotViewComponent,
    UserViewComponent,
    FarmFollowupsModule,
  ],
  templateUrl: './farm-lease-view.component.html',
})
export class FarmLeaseViewComponent implements OnChanges {
  @Input() lease: LeaseAgreement | null = null;
  @Input() refreshKey = 0;

  detail: LeaseAgreement | null = null;
  loading = false;
  error: string | null = null;
  followUpsLoading = false;

  paymentColumns: DataTableColumn<LeaseTerm>[] = [
    {header: 'Due', value: (t) => t.dueDate},
    {header: 'Amount', value: (t) => this.formatAmount(t.amount)},
    {header: 'Status', value: (t) => t.status},
  ];


  constructor(private farmLeaseService: FarmLeaseService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['lease'] || changes['refreshKey']) {
      if (this.lease?.id) {
        this.detail = this.lease;
      } else {
        this.detail = null;
        this.error = null;
      }
    }
  }


  statusPillClass(status: LeaseStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'PENDING':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'TERMINATED':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(
      value,
    );
  }
}
