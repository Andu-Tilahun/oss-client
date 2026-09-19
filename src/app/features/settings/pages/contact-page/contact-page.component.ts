import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemConfigService } from '../../../system-config/services/system-config.service';
import { OrganizationConfig } from '../../../system-config/models/organization-config.model';
import { SocialMediaLink } from '../../../system-config/models/social-media.model';
import { BranchCenter } from '../../../system-config/models/branch-center.model';
import { SocialIconComponent } from '../../../../shared/components/social-icon/social-icon.component';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, SocialIconComponent],
  templateUrl: './contact-page.component.html',
})
export class ContactPageComponent implements OnInit {
  orgConfig: OrganizationConfig | null = null;
  socialLinks: SocialMediaLink[] = [];
  branchCenters: BranchCenter[] = [];
  loading = true;

  constructor(private systemConfigService: SystemConfigService) {}

  ngOnInit(): void {
    this.systemConfigService.getOrganizationConfig().subscribe({
      next: (config) => { this.orgConfig = config; this.loading = false; },
      error: () => { this.loading = false; },
    });

    this.systemConfigService.getVisibleSocialMedia().subscribe({
      next: (links) => { this.socialLinks = links; },
      error: () => {},
    });

    this.systemConfigService.getBranchCenters().subscribe({
      next: (centers) => { this.branchCenters = centers; },
      error: () => {},
    });
  }

  get phoneHref(): string {
    const phone = this.orgConfig?.phone || this.orgConfig?.contactMobilePhone || '';
    return `tel:${phone.replace(/\s/g, '')}`;
  }

  get emailHref(): string {
    return `mailto:${this.orgConfig?.email || ''}`;
  }
}
