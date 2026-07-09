import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationConfigPageComponent } from '../organization-config-page/organization-config-page.component';
import { NewsManagementPageComponent } from '../news-management-page/news-management-page.component';
import { SocialMediaPageComponent } from '../social-media-page/social-media-page.component';

type Tab = 'organization' | 'news' | 'social-media';

@Component({
  selector: 'app-system-config-page',
  standalone: true,
  imports: [CommonModule, OrganizationConfigPageComponent, NewsManagementPageComponent, SocialMediaPageComponent],
  templateUrl: './system-config-page.component.html',
})
export class SystemConfigPageComponent {
  activeTab: Tab = 'organization';

  readonly tabs: { id: Tab; label: string }[] = [
    { id: 'organization', label: 'Organization' },
    { id: 'news',         label: 'News & Events' },
    { id: 'social-media', label: 'Social Media' },
  ];

  setTab(tab: Tab): void {
    this.activeTab = tab;
  }
}
