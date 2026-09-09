import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { ProfilePictureUploadComponent } from '../../../../shared/file-upload/profile-picture-upload/profile-picture-upload.component';
import { FileUploadService } from '../../../../shared/file-upload/file-upload.service';
import { ToastService } from '../../../../shared/toast/toast.service';
import { RegionService } from '../../../regions/services/region.service';
import { Region } from '../../../regions/models/region.model';
import { CoordinateInputComponent } from '../../../../shared/components/coordinate-input/coordinate-input.component';
import { FarmPlotRequest, FarmPlotSizeType, FarmPlotSoilType, FarmPlotStatus } from '../../models/farm-plot.model';
import { FarmPlotPreviewComponent, FarmPlotPreviewData } from '../farm-plot-preview/farm-plot-preview.component';

interface GalleryImageItem {
  id: string;
  previewUrl: string;
}

const MAX_GALLERY_FILE_SIZE = 10 * 1024 * 1024;

@Component({
  selector: 'app-farm-plot-create-wizard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ProfilePictureUploadComponent,
    CoordinateInputComponent,
    FarmPlotPreviewComponent,
  ],
  templateUrl: './farm-plot-create-wizard.component.html',
})
export class FarmPlotCreateWizardComponent implements OnInit {
  @Input() currentStep = 1;

  @ViewChild('mainImageUpload') mainImageUpload?: ProfilePictureUploadComponent;
  @ViewChild(CoordinateInputComponent) coordinateInput?: CoordinateInputComponent;

  basicInfoForm: FormGroup;
  locationForm: FormGroup;

  readonly lockedStatus: FarmPlotStatus = 'ACTIVE';
  readonly sizeTypes: FarmPlotSizeType[] = ['ACRES', 'HECTARES'];
  readonly soilTypes: FarmPlotSoilType[] = ['SANDY', 'CLAY', 'LOAMY'];

  regions: Region[] = [];
  regionsLoading = false;

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
      status: this.lockedStatus,
      regionName: this.regions.find((r) => r.id === location.regionId)?.name,
      imagePreviewUrl: this.mainImageUpload?.pendingPreviewUrl,
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
    if (step === 3) {
      return this.hasPendingMainImage();
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
    if (step === 3 && !this.hasPendingMainImage()) {
      this.toastService.error('Please select a plot image', 'Create Farm Plot');
    }
  }

  hasPendingMainImage(): boolean {
    return !!this.mainImageUpload?.hasPendingUpload();
  }

  uploadPendingMainImage(): Observable<string | undefined> {
    const pending = this.mainImageUpload?.pendingFile;
    if (!pending) {
      return of(undefined);
    }

    return this.fileUploadService.uploadFile(pending).pipe(
      filter((progress) => !!progress.file),
      take(1),
      map((progress) => progress.file!.id),
    );
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
      status: this.lockedStatus,
      regionId: location.regionId,
    };
  }

  getGalleryImageUuids(): string[] {
    return this.galleryImages.map((image) => image.id);
  }

  reset(): void {
    this.basicInfoForm.reset();
    this.locationForm.reset();
    this.galleryImages = [];
    if (this.mainImageUpload?.hasPendingUpload()) {
      this.mainImageUpload.removeImage();
    }
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
    this.fileUploadService.uploadFile(file).pipe(
      filter((progress) => !!progress.file),
      take(1),
    ).subscribe({
      next: (progress) => {
        this.galleryUploading = false;
        const uploaded = progress.file!;
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
