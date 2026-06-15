import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';
import { TableQueryParams } from '../../shared/data-table/models/table-query-params.model';
import { InvestmentPackage } from '../../features/investment-package/models/investment-package.model';
import { FundingStatus } from '../../shared/models/funding-status.model';
import { InvestmentPackageFilterComponent } from '../../features/investment-package/pages/investment-package-filter/investment-package-filter.component';

@Component({
  selector: 'app-public-plots',
  standalone: true,
  imports: [CommonModule, InvestmentPackageFilterComponent, SharedModule],
  templateUrl: './public-plots.component.html',
  styleUrl: './public-plots.component.css',
})
export class PublicPlotsComponent {
  @Input() pagedPackages: InvestmentPackage[] = [];
  @Input() loadingPackages = false;
  @Input() total = 0;
  @Input() pageSize = 10;
  @Input() pageIndex = 1;
  @Input() searchText = '';
  @Input() status: FundingStatus | '' = '';

  @Input() getPackageCardTitle: (pkg: InvestmentPackage) => string = (pkg) => pkg.title;
  @Input() getPublicCardSubtitle: (pkg: InvestmentPackage) => string = () => '';
  @Input() getPublicCardDescription: (pkg: InvestmentPackage) => string = () => '';
  @Input() getPackageThumbnailUrl: (pkg: InvestmentPackage) => string | null = () => null;
  @Input() getPackageThumbnailAlt: (pkg: InvestmentPackage) => string = () => '';
  @Input() getPublicCardBadges: (pkg: InvestmentPackage) => string[] = () => [];

  @Output() pageChange = new EventEmitter<TableQueryParams>();
  @Output() refreshClick = new EventEmitter<void>();
  @Output() primaryActionClick = new EventEmitter<InvestmentPackage>();
  @Output() secondaryActionClick = new EventEmitter<InvestmentPackage>();
  @Output() searchTextChange = new EventEmitter<string>();
  @Output() statusChange = new EventEmitter<FundingStatus | ''>();
  @Output() filterChange = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();
}
