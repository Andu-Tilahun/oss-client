import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FarmPlot, FarmPlotStatus} from '../../models/farm-plot.model';
import {FarmPlotService} from '../../services/farm-plot.service';
import {DetailCardComponent} from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import {DetailSectionComponent} from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import {DetailFieldComponent} from '../../../../shared/components/detail-field/detail-field/detail-field.component';
import {DocumentUploadComponent} from '../../../../shared/file-upload/document-upload/document-upload.component';
import {OssMapComponent} from '../../../../shared/oss-map/oss-map.component';

@Component({
  selector: 'app-farm-plot-view',
  standalone: true,
  imports: [
    CommonModule,
    DetailCardComponent,
    DetailSectionComponent,
    DetailFieldComponent,
    DocumentUploadComponent,
    OssMapComponent,
  ],
  templateUrl: './farm-plot-view.component.html',
})
export class FarmPlotViewComponent implements OnChanges {
  /**
   * Optional: if `plot` is provided, the component uses it directly (no extra API call).
   * Otherwise it will fetch by `id`.
   */
  @Input() plot: FarmPlot | null = null;

  /** Used when `plot` is not provided. */
  @Input() id?: string;

  @Input() refreshKey = 0;

  loading = false;
  error: string | null = null;

  constructor(private farmPlotService: FarmPlotService) {}

  ngOnChanges(changes: SimpleChanges): void {
    // If a plot object is passed from the list, don't fetch again.
    if (changes['plot']) {
      if (this.plot) {
        this.loading = false;
        this.error = null;
      } else if (this.id) {
        this.loadFromApi();
      }
      return;
    }

    // If id changes or refreshKey changes and no plot is provided, fetch.
    if ((changes['id'] || changes['refreshKey']) && !this.plot) {
      this.loadFromApi();
    }
  }

  private loadFromApi(): void {
    if (!this.id) return;

    this.loading = true;
    this.error = null;

    this.farmPlotService.getFarmPlotById(this.id).subscribe({
      next: (plot) => {
        this.plot = plot ?? null;
        this.loading = false;
      },
      error: () => {
        this.plot = null;
        this.error = 'Failed to load farm plot';
        this.loading = false;
      },
    });
  }


  statusPillClass(status: FarmPlotStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'INACTIVE':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'UNDER_MAINTENANCE':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  sizeText(p: FarmPlot): string {
    return `${p.size} ${p.sizeType}`;
  }
}

