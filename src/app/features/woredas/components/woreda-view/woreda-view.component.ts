import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Woreda } from '../../models/woreda.model';
import { WoredaService } from '../../services/woreda.service';
import { DetailCardComponent } from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import { DetailSectionComponent } from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import { DetailFieldComponent } from '../../../../shared/components/detail-field/detail-field/detail-field.component';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Component({
  selector: 'app-woreda-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './woreda-view.component.html',
})
export class WoredaViewComponent implements OnInit {
  @Input() id?: string;

  woreda: Woreda | null = null;
  loading = false;
  error: string | null = null;

  constructor(private woredaService: WoredaService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.id) return;
    this.loading = true;
    this.error = null;
    this.woredaService.getWoredaById(this.id).subscribe({
      next: (res: ApiResponse<Woreda>) => {
        this.woreda = res?.data ?? null;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load woreda';
        this.woreda = null;
        this.loading = false;
      },
    });
  }
}
