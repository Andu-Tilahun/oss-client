import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

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
export class PublicGalleryComponent {
  readonly galleryItems: PublicGalleryItem[] = [
    {
      id: 'video-harvest',
      title: 'Harvest season in the fields',
      description:
        'Our partner farms complete the harvest cycle with coordinated teams, ensuring crops are collected at peak quality for investors and local markets.',
      kind: 'video',
      src: 'assets/video/40724-426189626_medium.mp4',
    },
    {
      id: 'video-irrigation',
      title: 'Irrigation across rolling farmland',
      description:
        'Modern irrigation systems distribute water efficiently across large plots, supporting sustainable yields and reducing waste in dry seasons.',
      kind: 'video',
      src: 'assets/video/119717-718927401_medium.mp4',
    },
    {
      id: 'video-sunrise',
      title: 'Sunrise over the valley',
      description:
        'Early morning operations begin as sunlight reaches the valley floor, marking the start of daily field monitoring and maintenance routines.',
      kind: 'video',
      src: 'assets/video/168881-839807937_medium.mp4',
    },
    {
      id: 'video-aerial',
      title: 'Aerial view of active plots',
      description:
        'Drone footage helps investors and farm managers assess plot boundaries, crop health, and infrastructure from a comprehensive aerial perspective.',
      kind: 'video',
      src: 'assets/video/66810-520427372.mp4',
    },
    {
      id: 'image-greenhouse',
      title: 'Greenhouse cultivation',
      description:
        'Controlled greenhouse environments extend growing seasons and protect high-value crops from weather variability throughout the year.',
      kind: 'image',
      src: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80',
    },
    {
      id: 'image-tractor',
      title: 'Field preparation and planting',
      description:
        'Mechanized field preparation improves soil structure and planting consistency, laying the foundation for strong seasonal performance.',
      kind: 'image',
      src: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80',
    },
    {
      id: 'image-crops',
      title: 'Healthy crop rows at maturity',
      description:
        'Well-maintained crop rows at maturity reflect effective soil management, irrigation planning, and ongoing field supervision by local teams.',
      kind: 'image',
      src: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&q=80',
    },
    {
      id: 'image-livestock',
      title: 'Integrated farm operations',
      description:
        'Diversified farm operations combine crop production with complementary activities, supporting resilient revenue streams for investors.',
      kind: 'image',
      src: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80',
    },
  ];

  @ViewChild('modalVideo') modalVideoRef?: ElementRef<HTMLVideoElement>;

  showDetailModal = false;
  activeIndex = 0;

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
