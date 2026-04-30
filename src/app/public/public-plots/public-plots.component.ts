import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FarmPlotFilterComponent } from '../../features/farm-plots/pages/farm-plot-filter/farm-plot-filter.component';
import { SharedModule } from '../../shared/shared.module';
import { FarmPlot, FarmPlotSizeType, FarmPlotSoilType, FarmPlotStatus } from '../../features/farm-plots/models/farm-plot.model';
import { TableQueryParams } from '../../shared/data-table/models/table-query-params.model';

@Component({
  selector: 'app-public-plots',
  standalone: true,
  imports: [CommonModule, FarmPlotFilterComponent, SharedModule],
  templateUrl: './public-plots.component.html',
  styleUrl: './public-plots.component.css',
})
export class PublicPlotsComponent {
  @Input() pagedPlots: FarmPlot[] = [];
  @Input() loadingPlots = false;
  @Input() total = 0;
  @Input() pageSize = 10;
  @Input() pageIndex = 1;
  @Input() searchText = '';
  @Input() status: FarmPlotStatus | '' = '';
  @Input() soilType: FarmPlotSoilType | '' = '';
  @Input() sizeType: FarmPlotSizeType | '' = '';

  @Input() getPlotCardTitle: (plot: FarmPlot) => string = (plot) => plot.title;
  @Input() getPublicCardSubtitle: (plot: FarmPlot) => string = () => '';
  @Input() getPublicCardDescription: (plot: FarmPlot) => string = () => '';
  @Input() getPlotThumbnailUrl: (plot: FarmPlot) => string | null = () => null;
  @Input() getPlotThumbnailAlt: (plot: FarmPlot) => string = () => '';
  @Input() getPublicCardBadges: (plot: FarmPlot) => string[] = () => [];

  @Output() pageChange = new EventEmitter<TableQueryParams>();
  @Output() refreshClick = new EventEmitter<void>();
  @Output() primaryActionClick = new EventEmitter<FarmPlot>();
  @Output() secondaryActionClick = new EventEmitter<FarmPlot>();
  @Output() searchTextChange = new EventEmitter<string>();
  @Output() statusChange = new EventEmitter<FarmPlotStatus | ''>();
  @Output() soilTypeChange = new EventEmitter<FarmPlotSoilType | ''>();
  @Output() sizeTypeChange = new EventEmitter<FarmPlotSizeType | ''>();
  @Output() filterChange = new EventEmitter<void>();
  @Output() searchChange = new EventEmitter<void>();
  @Output() clearFilters = new EventEmitter<void>();
}
