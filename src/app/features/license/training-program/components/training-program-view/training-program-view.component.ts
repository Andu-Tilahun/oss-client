import { Component, HostListener, Input, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrainingProgram, QuotaType } from '../../models/training.model';
import { TrainingService } from '../../services/training.service';
import {DetailCardComponent} from "../../../../../shared/components/detail-field/detail-card/detail-card.component";
import {
  DetailSectionComponent
} from "../../../../../shared/components/detail-field/detail-section/detail-section.component";
import {DetailFieldComponent} from "../../../../../shared/components/detail-field/detail-field/detail-field.component";

@Component({
  selector: 'app-training-program-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './training-program-view.component.html',
  styleUrls: ['./training-program-view.component.css']
})
export class TrainingProgramViewComponent implements OnInit {
  @Input() userRequestId?: string;

  program: TrainingProgram | null = null;
  loading = false;
  error: string | null = null;

  readonly quotaType = QuotaType;

  constructor(private trainingService: TrainingService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.userRequestId) return;
    this.loading = true;
    this.error = null;
    this.trainingService.getByUserRequestId(this.userRequestId).subscribe({
      next: (a) => {
        this.program = a;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load applicant';
        this.program = null;
        this.loading = false;
      },
    });
  }

  get regionalQuotas() {
    return this.program?.quotas?.filter(q => q.quotaType === QuotaType.REGIONAL) ?? [];
  }

  get organizationalQuotas() {
    return this.program?.quotas?.filter(q => q.quotaType === QuotaType.ORGANIZATIONAL) ?? [];
  }

  getTotalQuota(): number {
    if (!this.program) return 0;
    return (this.program.privateQuota ?? 0) +
      (this.program.formerEmployeeQuota ?? 0) +
      this.regionalQuotas.reduce((s, q) => s + (q.quota ?? 0), 0) +
      this.organizationalQuotas.reduce((s, q) => s + (q.quota ?? 0), 0);
  }

  getTotalRegionalQuota(): number {
    return this.regionalQuotas.reduce((s, q) => s + (q.quota ?? 0), 0);
  }

  getTotalOrganizationalQuota(): number {
    return this.organizationalQuotas.reduce((s, q) => s + (q.quota ?? 0), 0);
  }

  getStatusClass(): string {
    if (!this.program?.status) return 'status-unknown';
    return 'status-' + this.program.status.toLowerCase();
  }
}
