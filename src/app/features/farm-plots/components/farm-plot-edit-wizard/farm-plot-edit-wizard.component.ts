import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ProfilePictureUploadComponent } from '../../../../shared/file-upload/profile-picture-upload/profile-picture-upload.component';
import { FileUploadService } from '../../../../shared/file-upload/file-upload.service';
import { ToastService } from '../../../../shared/toast/toast.service';
import { RegionService } from '../../../regions/services/region.service';
import { Region } from '../../../regions/models/region.model';
import { CoordinateInputComponent } from '../../../../shared/components/coordinate-input/coordinate-input.component';
import { FarmPlot, FarmPlotRequest, FarmPlotSizeType, FarmPlotSoilType, FarmPlotStatus } from '../../models/farm-plot.model';
import { FarmPlotPreviewComponent, FarmPlotPreviewData } from '../farm-plot-preview/farm-plot-preview.component';

interface GalleryImageItem {
  id: string;
  previewUrl: string;
}

const MAX_GALLERY_FILE_SIZE = 10 * 1024 * 1024;

@Component({
  selector: 'app-farm-plot-edit-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ProfilePictureUploadComponent,
    CoordinateInputComponent,
    FarmPlotPreviewComponent,
  ],
  templateUrl: './farm-plot-edit-wizard.component.html',
})
export class FarmPlotEditWizardComponent implements OnInit, OnChanges {
  @Input({ required: true }) farmPlot!: FarmPlot;
  @Input() currentStep = 1;

  @ViewChild('mainImageUpload') mainImageUpload?: ProfilePictureUploadComponent;
  @ViewChild(CoordinateInputComponent) coordinateInput?: CoordinateInputComponent;

  basicInfoForm: FormGroup;
  locationForm: FormGroup;

  readonly sizeTypes: FarmPlotSizeType[] = ['ACRES', 'HECTARES'];
  readonly soilTypes: FarmPlotSoilType[] = ['SANDY', 'CLAY', 'LOAMY'];
  readonly editableStatuses: FarmPlotStatus[] = ['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE'];

  regions: Region[] = [];
  regionsLoading = false;

  imageUuid?: string;
  galleryImages: GalleryImageItem[] = [];
  galleryUploading = false;

  constructor(
    private fb: FormBuilder,
    private fileUploadService: FileUploadService,
    private toastService: ToastService,
    private regionService: RegionService,
  ) {
    this.basicInfoForm = this.createBasicInfoForm();
    this.locationForm = this.createLocationForm();
  }

  ngOnInit(): void {
    this.loadRegions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['farmPlot'] && this.farmPlot) {
      this.syncFromFarmPlot();
    }
  }

  private syncFromFarmPlot(): void {
    this.patchFromFarmPlot();
    this.galleryImages = [];
    this.loadGalleryImages();
  }

  get isStatusEditable(): boolean {
    return this.editableStatuses.includes(this.farmPlot.status as FarmPlotStatus);
  }

  private createBasicInfoForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      size: ['', [Validators.required, Validators.min(0)]],
      sizeType: ['', Validators.required],
    });
  }

  private createLocationForm(): FormGroup {
    return this.fb.group({
      coordinates: [null, Validators.required],
      soilType: ['', Validators.required],
      regionId: ['', Validators.required],
      status: ['', Validators.required],
    });
  }

  private patchFromFarmPlot(): void {
    const plot = this.farmPlot;
    this.imageUuid = plot.imageUuid;

    this.basicInfoForm.patchValue({
      title: plot.title,
      description: plot.description ?? '',
      size: plot.size,
      sizeType: plot.sizeType,
    });

    this.locationForm.patchValue({
      coordinates: plot.latitude != null && plot.longitude != null
        ? { latitude: plot.latitude, longitude: plot.longitude }
        : null,
      soilType: plot.soilType,
      regionId: plot.regionId ?? '',
      status: plot.status,
    });
  }

  private loadRegions(): void {
    this.regionsLoading = true;
    this.regionService.filterRegions({ page: 0, size: 100 }).subscribe({
      next: (res) => {
        this.regions = res.content ?? [];
        this.regionsLoading = false;
      },
      error: () => {
        this.regionsLoading = false;
      },
    });
  }

  private loadGalleryImages(): void {
    const galleryIds = (this.farmPlot.gallery ?? [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => item.imageUuid)
      .filter((id) => !!id);

    if (galleryIds.length === 0) {
      return;
    }

    forkJoin(galleryIds.map((id) => this.fileUploadService.getFileMetadata(id))).subscribe({
      next: (metadataList) => {
        this.galleryImages = metadataList.map((metadata) => ({ id: metadata.id, previewUrl: metadata.presignedUrl }));
      },
      error: () => {
        this.galleryImages = galleryIds.map((id) => ({ id, previewUrl: this.fileUploadService.getFileUrl(id) }));
      },
    });
  }

  get previewData(): FarmPlotPreviewData {
    const basic = this.basicInfoForm.getRawValue();
    const location = this.locationForm.getRawValue();
    return {
      title: basic.title,
      description: basic.description,
      size: basic.size,
      sizeType: basic.sizeType,
      latitude: location.coordinates?.latitude,
      longitude: location.coordinates?.longitude,
      soilType: location.soilType,
      status: location.status,
      regionName: this.regions.find((r) => r.id === location.regionId)?.name,
      imagePreviewUrl: this.mainImageUpload?.previewUrl,
      galleryImages: this.galleryImages,
    };
  }

  isStepValid(step: number): boolean {
    if (step === 1) {
      return this.basicInfoForm.valid;
    }
    if (step === 2) {
      return this.locationForm.valid;
    }
    return true;
  }

  markStepTouched(step: number): void {
    if (step === 1) {
      this.markGroupTouched(this.basicInfoForm);
    }
    if (step === 2) {
      this.markGroupTouched(this.locationForm);
      this.coordinateInput?.markAllAsTouched();
    }
  }

  onImageUploaded(fileId: string): void {
    this.imageUuid = fileId;
  }

  onImageRemoved(): void {
    this.imageUuid = undefined;
  }

  getValue(): FarmPlotRequest {
    const basic = this.basicInfoForm.getRawValue();
    const location = this.locationForm.getRawValue();
    return {
      title: basic.title,
      description: basic.description,
      size: basic.size,
      sizeType: basic.sizeType,
      latitude: location.coordinates?.latitude,
      longitude: location.coordinates?.longitude,
      soilType: location.soilType,
      status: location.status,
      imageUuid: this.imageUuid,
      regionId: location.regionId,
    };
  }

  getGalleryImageUuids(): string[] {
    return this.galleryImages.map((image) => image.id);
  }

  reset(): void {
    this.syncFromFarmPlot();
  }

  triggerGalleryFileInput(input: HTMLInputElement): void {
    if (this.galleryUploading) {
      return;
    }
    input.click();
  }

  onGalleryFileSelected(event: Event): void {
    if (this.galleryUploading) {
      return; // a request is already in flight
    }
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.toastService.error('Please select an image file', 'Gallery');
      return;
    }

    if (file.size > MAX_GALLERY_FILE_SIZE) {
      this.toastService.error('File size must be less than 10MB', 'Gallery');
      return;
    }

    this.galleryUploading = true;
    this.fileUploadService.uploadFile(file).subscribe({
      next: (progress) => {
        if (!progress.file) {
          return;
        }
        this.galleryUploading = false;
        const uploaded = progress.file;
        this.galleryImages = [
          ...this.galleryImages,
          { id: uploaded.id, previewUrl: uploaded.presignedUrl },
        ];
      },
      error: (err) => {
        this.galleryUploading = false;
        this.toastService.error(err?.message || 'Failed to upload image', 'Gallery');
      },
    });
  }

  removeGallerySlot(index: number): void {
    this.galleryImages = this.galleryImages.filter((_, idx) => idx !== index);
  }

  openGalleryPreview(url: string): void {
    if (url) {
      window.open(url, '_blank');
    }
  }

  private markGroupTouched(fg: FormGroup): void {
    Object.keys(fg.controls).forEach((key) => {
      fg.get(key)?.markAsTouched();
    });
  }
}
