import {CommonModule} from '@angular/common';
import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {InvestmentRecord} from '../../models/crowd-funding.model';
import {DetailCardComponent} from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import {
  DetailSectionComponent
} from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import {DetailFieldComponent} from '../../../../shared/components/detail-field/detail-field/detail-field.component';
import {SharedModule} from '../../../../shared/shared.module';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {UserViewComponent} from "../../../users/components/user-view/user-view.component";
import {FarmFollowupsModule} from "../../../farm-followups/farm-followups.module";

@Component({
  selector: 'app-crowd-funding-investment-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent, SharedModule, UserViewComponent, FarmFollowupsModule],
  templateUrl: './crowd-funding-investment-view.component.html',
  styleUrl: './crowd-funding-investment-view.component.css',
})
export class CrowdFundingInvestmentViewComponent implements OnChanges {
  @Input() investment: InvestmentRecord | null = null;
  @Input() refreshKey = 0;


  formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(value);
  }

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['investment'] || changes['refreshKey']) {
     // this.loadFollowUps();
    }
  }
}

