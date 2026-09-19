import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsArticle } from '../../models/news-article.model';
import { DetailCardComponent } from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import { DetailSectionComponent } from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import { DetailFieldComponent } from '../../../../shared/components/detail-field/detail-field/detail-field.component';
import { environment } from '../../../../../environments/environment';
import { Endpoints } from '../../../../core/endpoint/endpoint.model';

@Component({
  selector: 'app-news-article-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './news-article-view.component.html',
})
export class NewsArticleViewComponent {
  @Input() article: NewsArticle | null = null;

  get mediaUrl(): string {
    return this.article?.mediaUuid ? `${environment.apiUrl}${Endpoints.STORAGE_ENDPOINT}/${this.article.mediaUuid}` : '';
  }

  statusPillClass(status: string): string {
    return status === 'PUBLISHED'
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-gray-100 text-gray-600 border-gray-200';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
