import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FarmPlotSizeType, FarmPlotSoilType, FarmPlotStatus } from '../../models/farm-plot.model';
import { OssMapComponent } from '../../../../shared/oss-map/oss-map.component';

export interface FarmPlotPreviewData {
  title?: string;
  description?: string;
  size?: number;
  sizeType?: FarmPlotSizeType;
  latitude?: number;
  longitude?: number;
  soilType?: FarmPlotSoilType;
  status?: FarmPlotStatus;
  regionName?: string;
  imagePreviewUrl?: string;
  galleryImages: { id: string; previewUrl: string }[];
}

@Component({
  selector: 'app-farm-plot-preview',
  standalone: true,
  imports: [CommonModule, OssMapComponent],
  templateUrl: './farm-plot-preview.component.html',
})
export class FarmPlotPreviewComponent {
  @Input({ required: true }) data!: FarmPlotPreviewData;
}
