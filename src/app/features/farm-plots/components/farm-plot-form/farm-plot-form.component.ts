import {Component, forwardRef, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {ProfilePictureUploadComponent} from '../../../../shared/file-upload/profile-picture-upload/profile-picture-upload.component';
import {FarmPlot, FarmPlotRequest, FarmPlotSizeType, FarmPlotSoilType, FarmPlotStatus} from '../../models/farm-plot.model';
import {DocumentUploadComponent} from "../../../../shared/file-upload/document-upload/document-upload.component";

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

  farmPlotForm: FormGroup;

  private onChange: any = () => {};
  private onTouched: any = () => {};

  readonly sizeTypes: Array<FarmPlotSizeType> = ['ACRES', 'HECTARES'];
  readonly soilTypes: Array<FarmPlotSoilType> = ['SANDY', 'CLAY', 'LOAMY'];
  readonly statuses: Array<FarmPlotStatus> = ['ACTIVE', 'INACTIVE', 'UNDER_MAINTENANCE','ASSIGNED_TO_LEASE'];

  // Track image file id locally since ProfilePictureUploadComponent controls its preview
  profileImageUuid?: string;
  galleryImageUuids: string[] = [''];

  constructor(private fb: FormBuilder) {
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
    this.galleryImageUuids = (plot.gallery ?? [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => item.imageUuid);
    if (this.galleryImageUuids.length === 0) {
      this.galleryImageUuids = [''];
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

  // ControlValueAccessor
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
    this.galleryImageUuids = [''];
  }

  onImageUploaded(fileId: string): void {
    this.farmPlotForm.patchValue({imageUuid: fileId});
  }

  onImageRemoved(): void {
    this.farmPlotForm.patchValue({imageUuid: ''});
    this.profileImageUuid = undefined;
  }

  addGallerySlot(): void {
    this.galleryImageUuids = [...this.galleryImageUuids, ''];
  }

  onGalleryImageUploaded(index: number, fileId: string): void {
    const copy = [...this.galleryImageUuids];
    copy[index] = fileId;
    this.galleryImageUuids = copy;
  }

  onGalleryImageRemoved(index: number): void {
    const copy = [...this.galleryImageUuids];
    copy[index] = '';
    this.galleryImageUuids = copy;
  }

  removeGallerySlot(index: number): void {
    if (this.galleryImageUuids.length === 1) {
      this.galleryImageUuids = [''];
      return;
    }
    this.galleryImageUuids = this.galleryImageUuids.filter((_, idx) => idx !== index);
  }

  getGalleryImageUuids(): string[] {
    return [...new Set(this.galleryImageUuids.filter((id) => !!id))];
  }
}

