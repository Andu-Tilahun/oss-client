import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CompanyProfile } from '../../features/farm-company/models/company-profile.model';
import { SystemConfigService } from '../../features/system-config/services/system-config.service';
import { SocialMediaLink, SocialMediaPlatform } from '../../features/system-config/models/social-media.model';

@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

  getSocialIcon(platform: SocialMediaPlatform): string {
    const icons: Record<SocialMediaPlatform, string> = {
      FACEBOOK: 'f',
      INSTAGRAM: '◉',
      TIKTOK: '♪',
      YOUTUBE: '▶',
      LINKEDIN: 'in',
      X: 'X',
      TWITTER: '🐦',
      TELEGRAM: '✈',
      WHATSAPP: '💬',
    };
    return icons[platform] ?? platform[0];
  }
}
