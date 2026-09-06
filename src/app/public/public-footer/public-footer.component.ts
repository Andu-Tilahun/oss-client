import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CompanyProfile } from '../../features/farm-company/models/company-profile.model';
import { SystemConfigService } from '../../features/system-config/services/system-config.service';
import { SocialMediaLink, SocialMediaPlatform } from '../../features/system-config/models/social-media.model';
import { SocialIconComponent, SOCIAL_BRAND_COLORS } from '../../shared/components/social-icon/social-icon.component';

@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [CommonModule, RouterModule, SocialIconComponent],
  templateUrl: './public-footer.component.html',
  styleUrl: './public-footer.component.css',
})
export class PublicFooterComponent implements OnInit {
  @Input() company: CompanyProfile | null = null;

  @Output() homeClick = new EventEmitter<void>();
  @Output() aboutClick = new EventEmitter<void>();
  @Output() contactClick = new EventEmitter<void>();

  socialLinks: SocialMediaLink[] = [];

  constructor(private systemConfigService: SystemConfigService) {}

  ngOnInit(): void {
    this.systemConfigService.getVisibleSocialMedia().subscribe({
      next: (links) => (this.socialLinks = links),
      error: () => {},
    });
  }

  brandColor(platform: SocialMediaPlatform): string {
    return SOCIAL_BRAND_COLORS[platform];
  }
}
