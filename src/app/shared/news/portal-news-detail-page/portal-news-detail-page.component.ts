import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SystemConfigService } from '../../../features/system-config/services/system-config.service';
import { NewsArticle } from '../../../features/system-config/models/news-article.model';
import { GalleryMediaKind } from '../../../features/system-config/models/gallery-item.model';
import { environment } from '../../../../environments/environment';
import { Endpoints } from '../../../core/endpoint/endpoint.model';

interface DetailGalleryItem {
  id: string;
  kind: 'video' | 'image';
  src: string;
}

@Component({
  selector: 'app-portal-news-detail-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './portal-news-detail-page.component.html',
  styleUrl: './portal-news-detail-page.component.css',
})
export class PortalNewsDetailPageComponent implements OnInit {
  article: NewsArticle | null = null;
  loading = true;
  error = false;

  @ViewChild('modalVideo') modalVideoRef?: ElementRef<HTMLVideoElement>;
  showDetailModal = false;
  activeIndex = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private systemConfigService: SystemConfigService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      this.error = true;
      return;
    }
    this.systemConfigService.getNewsById(id).subscribe({
      next: (article) => {
        this.article = article;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      },
    });
  }

  goBack(): void {
    this.router.navigate(['..'], { relativeTo: this.route });
  }

  get coverUrl(): string | null {
    if (!this.article?.mediaUuid) return null;
    return this.mediaSrc(this.article.mediaUuid, this.article.kind ?? 'IMAGE');
  }

  get galleryItems(): DetailGalleryItem[] {
    return (this.article?.media ?? []).map((m) => ({
      id: m.id,
      kind: m.kind === 'VIDEO' ? 'video' : 'image',
      src: this.mediaSrc(m.mediaUuid, m.kind),
    }));
  }

  get activeItem(): DetailGalleryItem | null {
    if (!this.showDetailModal) return null;
    return this.galleryItems[this.activeIndex] ?? null;
  }

  onVideoEnter(event: Event): void {
    (event.target as HTMLVideoElement).play().catch(() => undefined);
  }

  onVideoLeave(event: Event): void {
    const video = event.target as HTMLVideoElement;
    video.pause();
    video.currentTime = 0;
  }

  openGallery(index: number): void {
    this.activeIndex = index;
    this.showDetailModal = true;
    this.playModalVideoSoon();
  }

  closeGallery(): void {
    this.pauseModalVideo();
    this.showDetailModal = false;
  }

  goPrevious(): void {
    this.pauseModalVideo();
    const total = this.galleryItems.length;
    this.activeIndex = (this.activeIndex - 1 + total) % total;
    this.playModalVideoSoon();
  }

  goNext(): void {
    this.pauseModalVideo();
    const total = this.galleryItems.length;
    this.activeIndex = (this.activeIndex + 1) % total;
    this.playModalVideoSoon();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  private mediaSrc(mediaUuid: string, kind: GalleryMediaKind): string {
    return `${environment.apiUrl}${Endpoints.STORAGE_ENDPOINT}/${mediaUuid}${kind === 'VIDEO' ? '/stream' : ''}`;
  }

  private playModalVideoSoon(): void {
    setTimeout(() => this.playModalVideo());
  }

  private playModalVideo(): void {
    const video = this.modalVideoRef?.nativeElement;
    if (!video) return;
    video.load();
    video.play().catch(() => undefined);
  }

  private pauseModalVideo(): void {
    const video = this.modalVideoRef?.nativeElement;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  }
}
