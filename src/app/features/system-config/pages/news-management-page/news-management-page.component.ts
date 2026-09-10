import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SystemConfigService } from '../../services/system-config.service';
import { NewsArticle, NewsArticleFilterRequest, NewsArticleMediaItem, NewsAudience, NewsStatus } from '../../models/news-article.model';
import { ToastService } from '../../../../shared/toast/toast.service';
import { PageSplitLayoutComponent } from '../../../../shared/components/page-split-layout/page-split-layout/page-split-layout.component';
import { NewsArticleViewComponent } from '../../components/news-article-view/news-article-view.component';
import { NewsFilterComponent } from '../../components/news-filter/news-filter.component';
import { GalleryMediaPickerComponent, GalleryMediaSelection } from '../../components/gallery-media-picker/gallery-media-picker.component';
import { GalleryMediaKind } from '../../models/gallery-item.model';
import { SharedModule } from '../../../../shared/shared.module';
import { environment } from '../../../../../environments/environment';
import { Endpoints } from '../../../../core/endpoint/endpoint.model';
import { DataTableColumn } from '../../../../shared/data-table/models/data-table-column.model';
import { TableQueryParams } from '../../../../shared/data-table/models/table-query-params.model';
import { PageSplitRightAction } from '../../../../shared/components/page-split-layout/page-split-layout/page-split-right-action.model';

@Component({
  selector: 'app-news-management-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule, PageSplitLayoutComponent, NewsArticleViewComponent, NewsFilterComponent, GalleryMediaPickerComponent],
  templateUrl: './news-management-page.component.html',
})
export class NewsManagementPageComponent implements OnInit {
  articles: NewsArticle[] = [];
  selectedArticle: NewsArticle | null = null;
  detailRefreshKey = 0;

  loading = true;
  showModal = false;
  saving = false;
  deactivating: string | null = null;
  editingId: string | null = null;
  editingArticleMedia: NewsArticleMediaItem[] = [];
  addingMedia = false;
  removingMediaId: string | null = null;

  total = 0;
  pageSize = 10;
  pageIndex = 1;
  searchText = '';
  selectedStatus: NewsStatus | '' = '';
  selectedAudience: NewsAudience | '' = '';

  form!: FormGroup;

  readonly statusOptions: NewsStatus[] = ['DRAFT', 'PUBLISHED'];
  readonly audienceOptions: NewsAudience[] = ['PUBLIC', 'INVESTOR', 'EXTENSION_WORKER'];

  columns: DataTableColumn<NewsArticle>[] = [
    {
      header: 'Title', value: a => this.truncateTitle(a.title), cellClass: 'font-medium text-gray-800',
      cornerBadge: a => ({
        colorClass: a.status === 'PUBLISHED' ? 'bg-green-500' : a.status === 'INACTIVE' ? 'bg-red-400' : 'bg-gray-400',
        title: a.status === 'PUBLISHED' ? 'Published' : a.status === 'INACTIVE' ? 'Inactive' : 'Draft',
        icon: a.status === 'PUBLISHED' ? 'check' : 'dot',
      }),
    },
    { header: 'Category', value: a => a.category || '—', hiddenBelowPx: 640 },
    {
      header: 'Status', value: a => a.status, defaultVisible: false,
      cellClass: a => a.status === 'PUBLISHED'
        ? 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700'
        : a.status === 'INACTIVE'
          ? 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700'
          : 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600',
    },
    { header: 'Audience', value: a => a.audience, hiddenBelowPx: 768 },
    { header: 'Published', value: a => this.formatDate(a.publishedAt) },
  ];

  rowActions: PageSplitRightAction<NewsArticle>[] = [
    { id: 'edit', icon: 'edit', title: 'Edit', visible: a => a.status !== 'INACTIVE', action: a => this.openEdit(a) },
    {
      id: 'deactivate', icon: 'ban', title: 'Deactivate',
      visible: a => a.status === 'DRAFT',
      disabled: a => this.deactivating === a.id,
      action: a => this.onDeactivate(a.id),
    },
  ];

  constructor(
    private fb: FormBuilder,
    private systemConfigService: SystemConfigService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadArticles();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      title:       ['', [Validators.required, Validators.maxLength(300)]],
      summary:     ['', Validators.maxLength(600)],
      content:     [''],
      category:    [''],
      mediaUuid:   [''],
      kind:        [null as GalleryMediaKind | null],
      publishedAt: [''],
      status:      ['DRAFT', Validators.required],
      audience:    ['PUBLIC', Validators.required],
    });
  }

  loadArticles(): void {
    this.loading = true;
    const previousId = this.selectedArticle?.id;
    const request: NewsArticleFilterRequest = {
      searchText: this.searchText || undefined,
      status: this.selectedStatus || undefined,
      audience: this.selectedAudience || undefined,
      sortBy: 'modifiedDate',
      sortDirection: 'DESC',
      page: this.pageIndex - 1,
      size: this.pageSize,
    };
    this.systemConfigService.filterNews(request).subscribe({
      next: (page) => {
        this.articles = page.content;
        this.total = page.totalElements;
        this.loading = false;
        if (this.articles.length === 0) { this.selectedArticle = null; return; }
        if (previousId) {
          const match = this.articles.find(a => a.id === previousId);
          if (match) { this.selectedArticle = { ...match }; return; }
        }
        this.selectedArticle = { ...this.articles[0] };
        this.detailRefreshKey++;
      },
      error: () => { this.loading = false; },
    });
  }

  onPageChange(params: TableQueryParams): void {
    this.pageIndex = params.pageIndex;
    this.pageSize = params.pageSize;
    this.loadArticles();
  }

  onSearch(): void {
    this.pageIndex = 1;
    this.loadArticles();
  }

  onFilterChange(): void {
    this.pageIndex = 1;
    this.loadArticles();
  }

  clearFilters(): void {
    this.pageIndex = 1;
    this.loadArticles();
  }

  onView(article: NewsArticle): void {
    this.selectedArticle = { ...article };
  }

  openCreate(): void {
    this.editingId = null;
    this.editingArticleMedia = [];
    this.form.reset({ status: 'DRAFT', audience: 'PUBLIC', mediaUuid: '', kind: null });
    this.showModal = true;
  }

  openEdit(article: NewsArticle): void {
    this.editingId = article.id;
    this.editingArticleMedia = article.media ?? [];
    this.form.patchValue({
      title:       article.title,
      summary:     article.summary ?? '',
      content:     article.content ?? '',
      category:    article.category ?? '',
      mediaUuid:   article.mediaUuid ?? '',
      kind:        article.kind ?? null,
      publishedAt: article.publishedAt ? article.publishedAt.slice(0, 16) : '',
      status:      article.status,
      audience:    article.audience,
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onMediaSelected(selection: GalleryMediaSelection): void {
    this.form.patchValue({ mediaUuid: selection.id, kind: selection.kind });
  }

  onAddMedia(selection: GalleryMediaSelection): void {
    if (!this.editingId || this.addingMedia) return;
    this.addingMedia = true;
    this.systemConfigService.addNewsMedia(this.editingId, { mediaUuid: selection.id, kind: selection.kind }).subscribe({
      next: (media) => {
        this.addingMedia = false;
        this.editingArticleMedia = [...this.editingArticleMedia, media];
      },
      error: () => { this.addingMedia = false; },
    });
  }

  onRemoveMedia(item: NewsArticleMediaItem): void {
    if (!this.editingId || this.removingMediaId) return;
    this.removingMediaId = item.id;
    this.systemConfigService.deleteNewsMedia(this.editingId, item.id).subscribe({
      next: () => {
        this.removingMediaId = null;
        this.editingArticleMedia = this.editingArticleMedia.filter(m => m.id !== item.id);
      },
      error: () => { this.removingMediaId = null; },
    });
  }

  onSave(): void {
    if (this.saving) {
      return; // a request is already in flight (e.g. Enter pressed again)
    }
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.saving = true;
    const value = this.form.value;
    const request = {
      title:       value.title,
      summary:     value.summary || undefined,
      content:     value.content || undefined,
      category:    value.category || undefined,
      mediaUuid:   value.mediaUuid || undefined,
      kind:        value.kind || undefined,
      publishedAt: value.publishedAt || undefined,
      status:      value.status as NewsStatus,
      audience:    value.audience as NewsAudience,
    };

    const call$ = this.editingId
      ? this.systemConfigService.updateNews(this.editingId, request)
      : this.systemConfigService.createNews(request);

    call$.subscribe({
      next: () => {
        this.saving = false;
        this.showModal = false;
        this.loadArticles();
        this.toastService.success(this.editingId ? 'Article updated successfully' : 'Article created successfully');
      },
      error: () => { this.saving = false; },
    });
  }

  onDeactivate(id: string): void {
    if (this.deactivating) {
      return; // a request is already in flight (e.g. Enter pressed again)
    }
    if (!confirm('Deactivate this draft article? This cannot be undone.')) return;
    this.deactivating = id;
    this.systemConfigService.deactivateNews(id).subscribe({
      next: () => {
        this.deactivating = null;
        const article = this.articles.find(a => a.id === id);
        if (article) article.status = 'INACTIVE';
        if (this.selectedArticle?.id === id) this.selectedArticle = { ...this.selectedArticle, status: 'INACTIVE' };
        this.toastService.success('Article deactivated');
      },
      error: () => { this.deactivating = null; },
    });
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('en-US', { month: 'short' })}-${d.getFullYear()}`;
  }

  private truncateTitle(title: string): string {
    return title.length > 20 ? title.slice(0, 20) + '...' : title;
  }

  mediaUrl(item: NewsArticleMediaItem): string {
    return `${environment.apiUrl}${Endpoints.STORAGE_ENDPOINT}/${item.mediaUuid}${item.kind === 'VIDEO' ? '/stream' : ''}`;
  }
}
