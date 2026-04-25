import {Component, ViewChild} from '@angular/core';
import {CompanyProfile, CompanyProfileRequest} from '../../models/company-profile.model';
import {CompanyProfileService} from '../../services/company-profile.service';
import {ToastService} from '../../../../shared/toast/toast.service';
import {CompanyProfileFormComponent} from '../../components/company-profile-form/company-profile-form.component';

@Component({
  selector: 'app-company-profile-page',
  standalone: false,
  templateUrl: './company-profile-page.component.html',
})
export class CompanyProfilePageComponent {
  @ViewChild('companyForm') companyForm!: CompanyProfileFormComponent;

  companyProfile: CompanyProfile | null = null;
  loading = false;
  saving = false;

  constructor(
    private companyProfileService: CompanyProfileService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadCompanyProfile();
  }

  loadCompanyProfile(): void {
    this.loading = true;
    this.companyProfileService.getCompanyProfile().subscribe({
      next: (profile) => {
        this.companyProfile = profile;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.toastService.error(error.message || 'Failed to load company profile', 'Company Profile');
      },
    });
  }

  onSave(): void {
    if (!this.companyForm.isValid()) {
      this.companyForm.markAllAsTouched();
      return;
    }

    const request: CompanyProfileRequest = this.companyForm.getValue();
    this.saving = true;
    this.companyProfileService.updateCompanyProfile(request).subscribe({
      next: () => {
        this.saving = false;
        this.toastService.success('Company profile updated successfully');
        this.loadCompanyProfile();
      },
      error: (error) => {
        this.saving = false;
        this.toastService.error(error.message || 'Failed to update company profile', 'Company Profile');
      },
    });
  }
}
