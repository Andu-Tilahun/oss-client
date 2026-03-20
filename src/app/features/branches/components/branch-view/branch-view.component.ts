import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Branch } from '../../models/branch.model';
import { BranchService } from '../../services/branch.service';
import { DetailCardComponent } from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import { DetailSectionComponent } from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import { DetailFieldComponent } from '../../../../shared/components/detail-field/detail-field/detail-field.component';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Component({
  selector: 'app-branch-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './branch-view.component.html',
})
export class BranchViewComponent implements OnInit {
  @Input() id?: string;

  branch: Branch | null = null;
  loading = false;
  error: string | null = null;

  constructor(private branchService: BranchService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.id) return;
    this.loading = true;
    this.error = null;
    this.branchService.getBranchById(this.id).subscribe({
      next: (res: ApiResponse<Branch>) => {
        this.branch = res?.data ?? null;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load branch';
        this.branch = null;
        this.loading = false;
      },
    });
  }
}
