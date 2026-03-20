import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Organization } from '../../models/organization.model';
import { OrganizationService } from '../../services/organization.service';
import { DetailCardComponent } from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import { DetailSectionComponent } from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import { DetailFieldComponent } from '../../../../shared/components/detail-field/detail-field/detail-field.component';
import { ApiResponse } from '../../../../shared/models/api-response.model';

@Component({
  selector: 'app-organization-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './organization-view.component.html',
})
export class OrganizationViewComponent implements OnInit {
  @Input() id?: string;

  organization: Organization | null = null;
  loading = false;
  error: string | null = null;

  constructor(private organizationService: OrganizationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.id) return;
    this.loading = true;
    this.error = null;
    this.organizationService.getOrganizationById(this.id).subscribe({
      next: (res: ApiResponse<Organization>) => {
        this.organization = res?.data ?? null;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load organization';
        this.organization = null;
        this.loading = false;
      },
    });
  }
}
