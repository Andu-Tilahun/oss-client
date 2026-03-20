import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subcity } from '../../models/subcity.model';
import { SubcityService } from '../../services/subcity.service';
import { DetailCardComponent } from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import { DetailSectionComponent } from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import { DetailFieldComponent } from '../../../../shared/components/detail-field/detail-field/detail-field.component';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Component({
  selector: 'app-subcity-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './subcity-view.component.html',
})
export class SubcityViewComponent implements OnInit {
  @Input() id?: string;

  subcity: Subcity | null = null;
  loading = false;
  error: string | null = null;

  constructor(private subcityService: SubcityService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.id) return;
    this.loading = true;
    this.error = null;
    this.subcityService.getSubcityById(this.id).subscribe({
      next: (res: ApiResponse<Subcity>) => {
        this.subcity = res?.data ?? null;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load subcity';
        this.subcity = null;
        this.loading = false;
      },
    });
  }
}
