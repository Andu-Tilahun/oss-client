import {Component, forwardRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {forkJoin, Observable, of} from 'rxjs';
import {filter, map, take} from 'rxjs/operators';
import {ProfilePictureUploadComponent} from '../../../../shared/file-upload/profile-picture-upload/profile-picture-upload.component';
import {FarmPlot, FarmPlotRequest, FarmPlotSizeType, FarmPlotSoilType, FarmPlotStatus} from '../../models/farm-plot.model';
import {DocumentUploadComponent} from '../../../../shared/file-upload/document-upload/document-upload.component';
import {FileUploadService} from '../../../../shared/file-upload/file-upload.service';
import {ToastService} from '../../../../shared/toast/toast.service';

interface GalleryImageItem {
  id: string;
  previewUrl: string;
}

const MAX_GALLERY_FILE_SIZE = 10 * 1024 * 1024;

@Component({
  selector: 'app-farm-plot-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProfilePictureUploadComponent, DocumentUploadComponent],
  templateUrl: './farm-plot-form.component.html',
  styleUrls: ['./farm-plot-form.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FarmPlotFormComponent),
      multi: true
    }
  ]
})
export class FarmPlotFormComponent implements ControlValueAccessor, OnInit, OnChanges {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() farmPlot: FarmPlot | null = null;

  @ViewChild('mainImageUpload') mainImageUpload?: ProfilePictureUploadComponent;

  farmPlotForm: FormGroup;

  private onChange: any = () => {};
  private onTouched: any = () => {};

  readonly sizeTypes: Array<FarmPlotSizeType> = ['ACRES', 'HECTARES'];
  readonly soilTypes: Array<FarmPlotSoilType> = ['SANDY', 'CLAY', 'LOAMY'];
  readonly statuses: Array<FarmPlotStatus> = ['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE', 'ASSIGNED_TO_LEASE'];

  profileImageUuid?: string;
  galleryImages: GalleryImageItem[] = [];
  galleryUploading = false;

  constructor(
    private fb: FormBuilder,
    private fileUploadService: FileUploadService,
    private toastService: ToastService,
  ) {
    this.farmPlotForm = this.createForm();
  }

  ngOnInit(): void {
    this.farmPlotForm.valueChanges.subscribe((value) => {
      this.onChange(value);
    });
    if (this.farmPlot) {
      this.patchFormValues(this.farmPlot);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['farmPlot'] && this.farmPlot && this.mode === 'edit') {
      this.patchFormValues(this.farmPlot);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      size: ['', [Validators.required, Validators.min(0)]],
      sizeType: ['', Validators.required],
      latitude: ['', Validators.required],
      longitude: ['', Validators.required],
      soilType: ['', Validators.required],
      status: [this.mode === 'create' ? 'ACTIVE' : '', Validators.required],
      imageUuid: [''],
    });
  }

  private patchFormValues(plot: FarmPlot): void {
    this.profileImageUuid = plot.imageUuid;
    const galleryIds = (plot.gallery ?? [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => item.imageUuid)
      .filter((id) => !!id);

    this.galleryImages = [];
    if (galleryIds.length > 0) {
      forkJoin(
        galleryIds.map((id) => this.fileUploadService.getFileMetadata(id)),
      ).subscribe({
        next: (metadataList) => {
          this.galleryImages = metadataList.map((metadata) => ({
            id: metadata.id,
            previewUrl: metadata.presignedUrl,
          }));
        },
        error: () => {
          this.galleryImages = galleryIds.map((id) => ({
            id,
            previewUrl: this.fileUploadService.getFileUrl(id),
          }));
        },
      });
    }

    this.farmPlotForm.patchValue({
      title: plot.title,
      description: plot.description ?? '',
      size: plot.size,
      sizeType: plot.sizeType,
      latitude: plot.latitude,
      longitude: plot.longitude,
      soilType: plot.soilType,
      status: plot.status,
      imageUuid: plot.imageUuid ?? '',
    });
  }

  writeValue(value: FarmPlotRequest | null): void {
    if (!value) {
      return;
    }
    this.farmPlotForm.patchValue(value, {emitEvent: false});
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    isDisabled ? this.farmPlotForm.disable() : this.farmPlotForm.enable();
  }

  isValid(): boolean {
    return this.farmPlotForm.valid;
  }

  getValue(): FarmPlotRequest {
    return this.farmPlotForm.getRawValue();
  }

  markAllAsTouched(): void {
    Object.keys(this.farmPlotForm.controls).forEach((key) => {
      this.farmPlotForm.get(key)?.markAsTouched();
    });
  }

  reset(): void {
    this.farmPlotForm.reset({status: 'ACTIVE'});
    this.profileImageUuid = undefined;
    this.galleryImages = [];
    if (this.mainImageUpload?.hasPendingUpload()) {
      this.mainImageUpload.removeImage();
    }
  }

  hasPendingMainImage(): boolean {
    return this.mode === 'create' && !!this.mainImageUpload?.hasPendingUpload();
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

  onImageUploaded(fileId: string): void {
    this.farmPlotForm.patchValue({imageUuid: fileId});
  }

  onImageRemoved(): void {
    this.farmPlotForm.patchValue({imageUuid: ''});
    this.profileImageUuid = undefined;
  }

  triggerGalleryFileInput(input: HTMLInputElement): void {
    if (this.galleryUploading) {
      return;
    }
    input.click();
  }

  onGalleryFileSelected(event: Event): void {
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
          {id: uploaded.id, previewUrl: uploaded.presignedUrl},
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

  getGalleryImageUuids(): string[] {
    return this.galleryImages.map((image) => image.id);
  }
}
