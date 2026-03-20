import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Region } from '../../models/region.model';
import { RegionService } from '../../services/region.service';
import { DetailCardComponent } from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import { DetailSectionComponent } from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import { DetailFieldComponent } from '../../../../shared/components/detail-field/detail-field/detail-field.component';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Component({
  selector: 'app-region-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './region-view.component.html',
})
export class RegionViewComponent implements OnInit {
  @Input() id?: string;

  region: Region | null = null;
  loading = false;
  error: string | null = null;

  constructor(private regionService: RegionService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.id) return;
    this.loading = true;
    this.error = null;
    this.regionService.getRegionById(this.id).subscribe({
      next: (res: ApiResponse<Region>) => {
        this.region = res?.data ?? null;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load region';
        this.region = null;
        this.loading = false;
      },
    });
  }
}
