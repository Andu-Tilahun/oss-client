import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedModule } from '../../shared.module';
import { SystemConfigService } from '../../../features/system-config/services/system-config.service';
import { NewsArticle } from '../../../features/system-config/models/news-article.model';
import { GalleryMediaKind } from '../../../features/system-config/models/gallery-item.model';
import { environment } from '../../../../environments/environment';
import { Endpoints } from '../../../core/endpoint/endpoint.model';

const PAGE_SIZE = 20;
const NEAR_END_THRESHOLD = 5;

@Component({
  selector: 'app-portal-news-page',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './portal-news-page.component.html',
})
export class PortalNewsPageComponent implements OnInit {
  articles: NewsArticle[] = [];
  loading = true;
  loadingMore = false;
  reachedEnd = false;
  error = false;

  readonly nearEndThreshold = NEAR_END_THRESHOLD;

  private page = 0;

  constructor(
    private systemConfigService: SystemConfigService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.loadPage();
  }

  private loadPage(): void {
    this.systemConfigService.getPortalNews(this.page, PAGE_SIZE).subscribe({
      next: (page) => {
        this.articles = [...this.articles, ...page.content];
        this.reachedEnd = page.last;
        this.page += 1;
        this.loading = false;
        this.loadingMore = false;
      },
      error: () => {
        this.loading = false;
        this.loadingMore = false;
        this.error = true;
      },
    });
  }

  onNearEnd(): void {
    if (this.loadingMore || this.reachedEnd) return;
    this.loadingMore = true;
    this.loadPage();
  }

  onArticleClick(article: NewsArticle): void {
    this.router.navigate([article.id], { relativeTo: this.route });
  }

  getTitle = (article: NewsArticle): string => article.title;

  getSubtitle = (article: NewsArticle): string => {
    const date = this.formatDate(article.publishedAt);
    return date ? `${article.category ?? 'News'} • ${date}` : (article.category ?? 'News');
  };

  getDescription = (article: NewsArticle): string => article.summary ?? '';

  getImageUrl = (article: NewsArticle): string | null => {
    if (!article.mediaUuid) return null;
    const kind: GalleryMediaKind = article.kind ?? 'IMAGE';
    return `${environment.apiUrl}${Endpoints.STORAGE_ENDPOINT}/${article.mediaUuid}${kind === 'VIDEO' ? '/stream' : ''}`;
  };

  getImageAlt = (article: NewsArticle): string => article.title;

  getBadges = (article: NewsArticle): string[] => [article.audience];

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
}
