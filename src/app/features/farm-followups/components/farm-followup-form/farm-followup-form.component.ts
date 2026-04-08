import {Component, Input, OnChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {FarmFollowUpCreateRequest} from '../../models/farm-followup.model';
import {DocumentUploadComponent} from "../../../../shared/file-upload/document-upload/document-upload.component";

@Component({
  selector: 'app-farm-followup-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DocumentUploadComponent],
  templateUrl: './farm-followup-form.component.html',
})
export class FarmFollowUpFormComponent implements OnChanges {
  @Input() externalId: string | null = null;

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      externalId: ['', [Validators.required]],
      remark: ['', [Validators.required, Validators.maxLength(2000)]],
      attachment: [null],
    });
  }

  ngOnChanges(): void {
    if (this.externalId) {
      this.form.patchValue({externalId: this.externalId});
      this.form.get('externalId')?.disable({emitEvent: false});
    } else {
      this.form.get('externalId')?.enable({emitEvent: false});
    }
  }

  isValid(): boolean {
    return this.form.valid;
  }

  markAllAsTouched(): void {
    Object.values(this.form.controls).forEach(c => {
      c.markAsDirty();
      c.markAsTouched();
      c.updateValueAndValidity({onlySelf: true});
    });
  }

  getValue(): FarmFollowUpCreateRequest {
    const raw = this.form.getRawValue();
    return {
      externalId: raw.externalId,
      remark: raw.remark,
      attachment: raw.attachment,
    };
  }

  reset(externalId?: string): void {
    this.form.reset({
      externalId: externalId ?? '',
      remark: '',
      attachment: null,
    });
    if (externalId) {
      this.form.get('externalId')?.disable({emitEvent: false});
    } else {
      this.form.get('externalId')?.enable({emitEvent: false});
    }
  }

  onFileUpload(fileId: string) {
    this.form.patchValue({
      attachment: fileId
    });
  }

  onFileRemoved() {
    this.form.patchValue({
      attachment: null
    });
  }
}

