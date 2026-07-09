import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SystemConfigService } from '../../services/system-config.service';
import { NewsArticle, NewsStatus } from '../../models/news-article.model';

@Component({
  selector: 'app-news-management-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './news-management-page.component.html',
})
export class NewsManagementPageComponent implements OnInit {
  articles: NewsArticle[] = [];
  loading = true;
  showModal = false;
  saving = false;
  deleting: string | null = null;
  editingId: string | null = null;
  error = '';

  form!: FormGroup;

  readonly statusOptions: NewsStatus[] = ['DRAFT', 'PUBLISHED'];

  constructor(private fb: FormBuilder, private systemConfigService: SystemConfigService) {}

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
    this.systemConfigService.getAllNews(0, 50).subscribe({
      next: (page) => {
        this.articles = page.content;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load articles.';
      },
    });
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

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
      },
      error: () => {
        this.saving = false;
        this.error = 'Save failed.';
      },
    });
  }

  onDelete(id: string): void {
    if (!confirm('Delete this article?')) return;
    this.deleting = id;
    this.systemConfigService.deleteNews(id).subscribe({
      next: () => {
        this.deleting = null;
        this.articles = this.articles.filter(a => a.id !== id);
      },
      error: () => {
        this.deleting = null;
        this.error = 'Delete failed.';
      },
    });
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
