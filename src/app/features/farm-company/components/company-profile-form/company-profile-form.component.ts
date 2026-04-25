import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CompanyProfile, CompanyProfileRequest} from '../../models/company-profile.model';

@Component({
  selector: 'app-company-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './company-profile-form.component.html',
})
export class CompanyProfileFormComponent implements OnChanges {
  @Input() companyProfile: CompanyProfile | null = null;
  @Input() loading = false;

  companyProfileForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.companyProfileForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(200)]],
      latitude: ['', Validators.required],
      longitude: ['', Validators.required],
      contactMobilePhone: ['', [Validators.required, Validators.maxLength(30)]],
      officePhone: ['', [Validators.required, Validators.maxLength(30)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      bankAccount: ['', [Validators.required, Validators.maxLength(255)]],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['companyProfile'] && this.companyProfile) {
      this.companyProfileForm.patchValue({
        name: this.companyProfile.name,
        latitude: this.companyProfile.latitude,
        longitude: this.companyProfile.longitude,
        contactMobilePhone: this.companyProfile.contactMobilePhone,
        officePhone: this.companyProfile.officePhone,
        email: this.companyProfile.email,
        bankAccount: this.companyProfile.bankAccount,
      });
    }
  }

  isValid(): boolean {
    return this.companyProfileForm.valid;
  }

  markAllAsTouched(): void {
    this.companyProfileForm.markAllAsTouched();
  }

  getValue(): CompanyProfileRequest {
    return this.companyProfileForm.getRawValue();
  }
}
