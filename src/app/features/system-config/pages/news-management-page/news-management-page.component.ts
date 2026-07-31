import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SystemConfigService } from '../../services/system-config.service';
import { NewsArticle, NewsStatus } from '../../models/news-article.model';
import { ToastService } from '../../../../shared/toast/toast.service';
import { PageSplitLayoutComponent } from '../../../../shared/components/page-split-layout/page-split-layout/page-split-layout.component';
import { NewsArticleViewComponent } from '../../components/news-article-view/news-article-view.component';

@Component({
  selector: 'app-news-management-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PageSplitLayoutComponent, NewsArticleViewComponent],
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

  form!: FormGroup;

  readonly statusOptions: NewsStatus[] = ['DRAFT', 'PUBLISHED'];

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
      publishedAt: [''],
      status:      ['DRAFT', Validators.required],
    });
  }

  loadArticles(): void {
    this.loading = true;
    const previousId = this.selectedArticle?.id;
    this.systemConfigService.getAllNews(0, 50).subscribe({
      next: (page) => {
        this.articles = page.content;
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

  onView(article: NewsArticle): void {
    this.selectedArticle = { ...article };
  }

  openCreate(): void {
    this.editingId = null;
    this.form.reset({ status: 'DRAFT' });
    this.showModal = true;
  }

  openEdit(article: NewsArticle): void {
    this.editingId = article.id;
    this.form.patchValue({
      title:       article.title,
      summary:     article.summary ?? '',
      content:     article.content ?? '',
      category:    article.category ?? '',
      publishedAt: article.publishedAt ? article.publishedAt.slice(0, 16) : '',
      status:      article.status,
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
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
