import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SystemConfigService } from '../../features/system-config/services/system-config.service';
import { GalleryItem } from '../../features/system-config/models/gallery-item.model';
import { environment } from '../../../environments/environment';
import { Endpoints } from '../../core/endpoint/endpoint.model';

interface PublicGalleryItem {
  id: string;
  title: string;
  description: string;
  kind: 'video' | 'image';
  src: string;
}

@Component({
  selector: 'app-public-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-gallery.component.html',
  styleUrl: './public-gallery.component.css',
})
export class PublicGalleryComponent implements OnInit {
  galleryItems: PublicGalleryItem[] = [];
  loading = true;
  error = false;

  @ViewChild('modalVideo') modalVideoRef?: ElementRef<HTMLVideoElement>;

  showDetailModal = false;
  activeIndex = 0;

  constructor(private systemConfigService: SystemConfigService) {}

  ngOnInit(): void {
    this.systemConfigService.getVisibleGalleryItems().subscribe({
      next: (items) => {
        this.galleryItems = items.map((item) => this.toPublicItem(item));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = true;
      },
    });
  }

  private toPublicItem(item: GalleryItem): PublicGalleryItem {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      kind: item.kind === 'VIDEO' ? 'video' : 'image',
      src: `${environment.apiUrl}${Endpoints.STORAGE_ENDPOINT}/${item.mediaUuid}`,
    };
  }

  get activeItem(): PublicGalleryItem | null {
    if (!this.showDetailModal || this.galleryItems.length === 0) {
      return null;
    }
    return this.galleryItems[this.activeIndex];
  }

  onVideoEnter(event: Event): void {
    const video = event.target as HTMLVideoElement;
    video.play().catch(() => undefined);
  }

  onVideoLeave(event: Event): void {
    const video = event.target as HTMLVideoElement;
    video.pause();
    video.currentTime = 0;
  }

  openDetail(index: number): void {
    this.activeIndex = index;
    this.showDetailModal = true;
    this.playModalVideoSoon();
  }

  closeDetail(): void {
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

  private playModalVideoSoon(): void {
    setTimeout(() => this.playModalVideo());
  }

  private playModalVideo(): void {
    const video = this.modalVideoRef?.nativeElement;
    if (!video) {
      return;
    }
    video.load();
    video.play().catch(() => undefined);
  }

  private pauseModalVideo(): void {
    const video = this.modalVideoRef?.nativeElement;
    if (!video) {
      return;
    }
    video.pause();
    video.currentTime = 0;
  }
}
