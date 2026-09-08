import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SystemConfigService } from '../../services/system-config.service';
import { NewsArticle, NewsArticleFilterRequest, NewsStatus } from '../../models/news-article.model';
import { ToastService } from '../../../../shared/toast/toast.service';
import { PageSplitLayoutComponent } from '../../../../shared/components/page-split-layout/page-split-layout/page-split-layout.component';
import { NewsArticleViewComponent } from '../../components/news-article-view/news-article-view.component';
import { NewsFilterComponent } from '../../components/news-filter/news-filter.component';
import { GalleryMediaPickerComponent, GalleryMediaSelection } from '../../components/gallery-media-picker/gallery-media-picker.component';
import { GalleryMediaKind } from '../../models/gallery-item.model';
import { SharedModule } from '../../../../shared/shared.module';
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
  deleting: string | null = null;
  editingId: string | null = null;

  total = 0;
  pageSize = 10;
  pageIndex = 1;
  searchText = '';
  selectedStatus: NewsStatus | '' = '';

  form!: FormGroup;

  readonly statusOptions: NewsStatus[] = ['DRAFT', 'PUBLISHED'];

  columns: DataTableColumn<NewsArticle>[] = [
    { header: 'Title', value: a => a.title, cellClass: 'font-medium text-gray-800' },
    { header: 'Category', value: a => a.category || '—', hiddenBelowPx: 640 },
    {
      header: 'Status', value: a => a.status,
      cellClass: a => a.status === 'PUBLISHED'
        ? 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700'
        : 'inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600',
    },
    { header: 'Published', value: a => this.formatDate(a.publishedAt) },
  ];

  rowActions: PageSplitRightAction<NewsArticle>[] = [
    { id: 'edit', icon: 'edit', title: 'Edit', action: a => this.openEdit(a) },
    { id: 'delete', icon: 'delete', title: 'Delete', disabled: a => this.deleting === a.id, action: a => this.onDelete(a.id) },
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
    });
  }

  loadArticles(): void {
    this.loading = true;
    const previousId = this.selectedArticle?.id;
    const request: NewsArticleFilterRequest = {
      searchText: this.searchText || undefined,
      status: this.selectedStatus || undefined,
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
    this.form.reset({ status: 'DRAFT', mediaUuid: '', kind: null });
    this.showModal = true;
  }

  openEdit(article: NewsArticle): void {
    this.editingId = article.id;
    this.form.patchValue({
      title:       article.title,
      summary:     article.summary ?? '',
      content:     article.content ?? '',
      category:    article.category ?? '',
      mediaUuid:   article.mediaUuid ?? '',
      kind:        article.kind ?? null,
      publishedAt: article.publishedAt ? article.publishedAt.slice(0, 16) : '',
      status:      article.status,
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onMediaSelected(selection: GalleryMediaSelection): void {
    this.form.patchValue({ mediaUuid: selection.id, kind: selection.kind });
  }

  onSave(): void {
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

  onDelete(id: string): void {
    if (!confirm('Delete this article?')) return;
    this.deleting = id;
    this.systemConfigService.deleteNews(id).subscribe({
      next: () => {
        this.deleting = null;
        if (this.selectedArticle?.id === id) this.selectedArticle = null;
        this.articles = this.articles.filter(a => a.id !== id);
        this.toastService.success('Article deleted');
      },
      error: () => { this.deleting = null; },
    });
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
