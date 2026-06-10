import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FarmGallery, FarmPlot, FarmPlotStatus} from '../../models/farm-plot.model';
import {FarmPlotService} from '../../services/farm-plot.service';
import {DetailCardComponent} from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import {DetailSectionComponent} from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import {DetailFieldComponent} from '../../../../shared/components/detail-field/detail-field/detail-field.component';
import {OssMapComponent} from '../../../../shared/oss-map/oss-map.component';
import {ImageGalleryModalComponent} from '../../../../shared/modals/image-gallery-modal/image-gallery-modal.component';
import {ImageUploadModalComponent} from '../../../../shared/modals/image-upload-modal/image-upload-modal.component';
import {ToastService} from '../../../../shared/toast/toast.service';
import {environment} from '../../../../../environments/environment';

@Component({
  selector: 'app-farm-plot-view',
  standalone: true,
  imports: [
    CommonModule,
    DetailCardComponent,
    DetailSectionComponent,
    DetailFieldComponent,
    OssMapComponent,
    ImageGalleryModalComponent,
    ImageUploadModalComponent,
  ],
  templateUrl: './farm-plot-view.component.html',
})
export class FarmPlotViewComponent implements OnChanges {
  /**
   * Optional: if `plot` is provided, the component uses it directly (no extra API call).
   * Otherwise it will fetch by `id`.
   */
  @Input() plot: FarmPlot | null = null;

  /** Used when `plot` is not provided. */
  @Input() id?: string;

  @Input() refreshKey = 0;
  @Input() showCreateLeaseButton = false;
  @Input() createLeaseButtonText = 'Create Lease Agreement';
  @Input() allowGalleryUpload = true;
  @Output() createLease = new EventEmitter<void>();

  loading = false;
  error: string | null = null;
  galleryItems: FarmGallery[] = [];
  previewGalleryUrls: string[] = [];
  allGalleryUrls: string[] = [];
  galleryLoading = false;
  showGalleryModal = false;
  galleryModalInitialIndex = 0;
  showUploadModal = false;
  galleryUploading = false;

  private readonly storageApiUrl = `${environment.apiUrl}/files`;

  constructor(
    private farmPlotService: FarmPlotService,
    private toastService: ToastService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['plot']) {
      if (this.plot) {
        this.loading = false;
        this.error = null;
        this.loadGallery(this.plot.id);
      } else if (this.id) {
        this.clearGallery();
        this.loadFromApi();
      } else {
        this.clearGallery();
      }
      return;
    }

    if (changes['refreshKey'] && this.plot?.id) {
      this.loadGallery(this.plot.id);
      return;
    }

    if (changes['id'] && !this.plot) {
      this.loadFromApi();
    }
  }

  private loadFromApi(): void {
    if (!this.id) return;

    this.loading = true;
    this.error = null;

    this.farmPlotService.getFarmPlotById(this.id).subscribe({
      next: (plot) => {
        this.plot = plot ?? null;
        this.loading = false;
        if (this.plot?.id) {
          this.loadGallery(this.plot.id);
        } else {
          this.clearGallery();
        }
      },
      error: () => {
        this.plot = null;
        this.error = 'Failed to load farm plot';
        this.loading = false;
        this.clearGallery();
      },
    });
  }

  private loadGallery(plotId: string): void {
    this.galleryLoading = true;
    this.galleryItems = [];
    this.previewGalleryUrls = [];
    this.allGalleryUrls = [];

    this.farmPlotService.getFarmPlotGallery(plotId).subscribe({
      next: (gallery) => {
        this.galleryItems = gallery.slice().sort((a, b) => a.sortOrder - b.sortOrder);
        this.allGalleryUrls = this.galleryItems
          .map((item) => this.toStorageUrl(item.imageUuid))
          .filter((url): url is string => !!url);
        this.previewGalleryUrls = this.allGalleryUrls.slice(0, 3);
        this.galleryLoading = false;
      },
      error: () => {
        this.clearGallery();
      },
    });
  }

  private clearGallery(): void {
    this.galleryItems = [];
    this.previewGalleryUrls = [];
    this.allGalleryUrls = [];
    this.galleryLoading = false;
  }

  get galleryTitle(): string {
    return this.plot?.title ? `${this.plot.title} Gallery` : 'Image Gallery';
  }

  openGallery(startIndex: number): void {
    if (this.allGalleryUrls.length === 0) {
      return;
    }
    this.galleryModalInitialIndex = startIndex;
    this.showGalleryModal = true;
  }

  openGalleryUpload(): void {
    this.showUploadModal = true;
  }

  onGalleryImageUploaded(imageUuid: string): void {
    if (!this.plot?.id) {
      return;
    }

    this.galleryUploading = true;
    this.farmPlotService.addFarmPlotGalleryImage(this.plot.id, {imageUuid}).subscribe({
      next: () => {
        this.galleryUploading = false;
        this.toastService.success('Gallery image added successfully');
        this.loadGallery(this.plot!.id);
      },
      error: (err) => {
        this.galleryUploading = false;
        this.toastService.error(err?.message || 'Failed to add gallery image', 'Gallery');
      },
    });
  }

  onGalleryUploadError(message: string): void {
    this.toastService.error(message, 'Gallery');
  }

  getMainImageUrl(): string | null {
    return this.plot?.imageUuid ? this.toStorageUrl(this.plot.imageUuid) : null;
  }

  openImagePreview(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  private toStorageUrl(imageUuid?: string): string | null {
    return imageUuid ? `${this.storageApiUrl}/${imageUuid}` : null;
  }

  statusPillClass(status: FarmPlotStatus | undefined): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'INACTIVE':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'UNDER_MAINTENANCE':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  sizeText(p: FarmPlot): string {
    return `${p.size} ${p.sizeType}`;
  }

  onCreateLease(): void {
    this.createLease.emit();
  }
}
