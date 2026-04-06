import {CommonModule} from '@angular/common';
import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {InvestmentRecord} from '../../models/crowd-funding.model';
import {FarmFollowUpsService} from '../../../farm-followups/services/farm-followups.service';
import {FarmOperationFollowUp} from '../../../farm-followups/models/farm-followups.model';
import {DetailCardComponent} from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import {
  DetailSectionComponent
} from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import {DetailFieldComponent} from '../../../../shared/components/detail-field/detail-field/detail-field.component';
import {SharedModule} from '../../../../shared/shared.module';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {UserViewComponent} from "../../../users/components/user-view/user-view.component";

@Component({
  selector: 'app-crowd-funding-investment-view',
  standalone: true,
    imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent, SharedModule, UserViewComponent],
  templateUrl: './crowd-funding-investment-view.component.html',
  styleUrl: './crowd-funding-investment-view.component.css',
})
export class CrowdFundingInvestmentViewComponent implements OnChanges {
  @Input() investment: InvestmentRecord | null = null;
  @Input() refreshKey = 0;

  followUps: FarmOperationFollowUp[] = [];
  followUpsLoading = false;
  followUpColumns: DataTableColumn<FarmOperationFollowUp>[] = [
    {header: 'Scheduled', value: (f) => f.scheduledDate || '-'},
    {header: 'Status', value: (f) => f.status || '-'},
    {header: 'Plan remark', value: (f) => f.remark || '-'},
    {header: 'Follow-up remark', value: (f) => f.followUpRemark || '-'},
  ];

  formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(value);
  }

  constructor(private followUpsService: FarmFollowUpsService) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['investment'] || changes['refreshKey']) {
     // this.loadFollowUps();
    }
  }

  private loadFollowUps(): void {
    const operationId = this.investment?.crowdFunding?.id;
    if (!operationId) {
      this.followUps = [];
      return;
    }

    this.followUpsLoading = true;
    this.followUpsService.getFarmOperationFollowUpsHistory(operationId).subscribe({
      next: (items) => {
        this.followUps = items;
        this.followUpsLoading = false;
      },
      error: () => {
        this.followUps = [];
        this.followUpsLoading = false;
      },
    });
  }
}

