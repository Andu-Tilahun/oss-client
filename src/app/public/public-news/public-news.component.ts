import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemConfigService } from '../../features/system-config/services/system-config.service';
import { NewsArticle } from '../../features/system-config/models/news-article.model';
import { GalleryMediaKind } from '../../features/system-config/models/gallery-item.model';
import { environment } from '../../../environments/environment';
import { Endpoints } from '../../core/endpoint/endpoint.model';

interface PublicNewsItem {
  id: string;
  year: string;
  date: string;
  title: string;
  summary: string;
  excerpt: string;
  body: string;
  category: string;
  mediaUrl: string;
  mediaKind: GalleryMediaKind;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80';

@Component({
  selector: 'app-public-news',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-news.component.html',
  styleUrl: './public-news.component.css',
})
export class PublicNewsComponent implements OnInit {
  private readonly pageSize = 5;

  allNewsItems: PublicNewsItem[] = [];
  loading = true;
  error = false;

  sidebarPage = 0;
  activeItemIndex = 0;
  bodyExpanded = false;

  constructor(private systemConfigService: SystemConfigService) {}

  ngOnInit(): void {
    this.systemConfigService.getPublishedNews(0, 50).subscribe({
      next: (page) => {
        this.allNewsItems = page.content.map(a => this.toPublicItem(a));
        this.activeItemIndex = 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      },
    });
  }

  private toPublicItem(article: NewsArticle): PublicNewsItem {
    const publishedAt = article.publishedAt ? new Date(article.publishedAt) : new Date(article.createdAt ?? '');
    const kind: GalleryMediaKind = article.kind ?? 'IMAGE';
    const mediaUrl = article.mediaUuid
      ? `${environment.apiUrl}${Endpoints.STORAGE_ENDPOINT}/${article.mediaUuid}${kind === 'VIDEO' ? '/stream' : ''}`
      : DEFAULT_IMAGE;
    return {
      id: article.id,
      year: publishedAt.getFullYear().toString(),
      date: publishedAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      title: article.title,
      summary: article.summary ?? '',
      excerpt: article.summary ?? '',
      body: article.content ?? '',
      category: article.category ?? 'News',
      mediaUrl,
      mediaKind: article.mediaUuid ? kind : 'IMAGE',
    };
  }

  get sidebarItems(): PublicNewsItem[] {
    const start = this.sidebarPage * this.pageSize;
    return this.allNewsItems.slice(start, start + this.pageSize);
  }

  get activeItem(): PublicNewsItem | null {
    return this.allNewsItems[this.activeItemIndex] ?? null;
  }

  get totalSidebarPages(): number {
    return Math.ceil(this.allNewsItems.length / this.pageSize);
  }

  selectItem(item: PublicNewsItem): void {
    this.activeItemIndex = this.allNewsItems.findIndex((n) => n.id === item.id);
    this.bodyExpanded = false;
  }

  showNextNews(): void {
    this.sidebarPage = (this.sidebarPage + 1) % this.totalSidebarPages;
    const firstItem = this.sidebarItems[0];
    if (firstItem) this.selectItem(firstItem);
  }

  toggleBodyExpanded(): void {
    this.bodyExpanded = !this.bodyExpanded;
  }
}
