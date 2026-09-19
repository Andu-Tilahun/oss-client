import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemConfigService } from '../../../system-config/services/system-config.service';
import { OrganizationConfig } from '../../../system-config/models/organization-config.model';
import { FileUploadService } from '../../../../shared/file-upload/file-upload.service';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-page.component.html',
})
export class AboutPageComponent implements OnInit {
  orgConfig: OrganizationConfig | null = null;
  loading = true;

  constructor(
    private systemConfigService: SystemConfigService,
    private fileUploadService: FileUploadService,
  ) {}

  ngOnInit(): void {
    this.systemConfigService.getOrganizationConfig().subscribe({
      next: (config) => {
        this.orgConfig = config;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  get logoUrl(): string | null {
    return this.orgConfig?.logoUuid ? this.fileUploadService.getFileUrl(this.orgConfig.logoUuid) : null;
  }
}
