import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SystemConfigService } from '../../services/system-config.service';
import { OrganizationConfig } from '../../models/organization-config.model';
import { BranchCenter, BranchCenterRequest } from '../../models/branch-center.model';
import { ProfilePictureUploadComponent } from '../../../../shared/file-upload/profile-picture-upload/profile-picture-upload.component';

@Component({
  selector: 'app-organization-config-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProfilePictureUploadComponent],
  templateUrl: './organization-config-page.component.html',
})
export class OrganizationConfigPageComponent implements OnInit {
  form!: FormGroup;
  branchForm!: FormGroup;

  loading = true;
  saving = false;
  saved = false;
  error = '';

  config: OrganizationConfig | null = null;

  branchCenters: BranchCenter[] = [];
  showBranchModal = false;
  editingBranch: BranchCenter | null = null;
  savingBranch = false;
  branchError = '';

  constructor(private fb: FormBuilder, private systemConfigService: SystemConfigService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name:                ['', [Validators.required, Validators.maxLength(200)]],
      tagline:             ['', Validators.maxLength(500)],
      address:             [''],
      operatingHours:      [''],
      email:               ['', Validators.email],
      phone:               [''],
      contactMobilePhone:  [''],
      officePhone:         [''],
      bankAccount:         [''],
      latitude:            [null],
      longitude:           [null],
      aboutUs:             [''],
      logoUuid:            [null],
    });

    this.branchForm = this.fb.group({
      name:           ['', [Validators.required, Validators.maxLength(200)]],
      address:        [''],
      phone:          [''],
      email:          ['', Validators.email],
      latitude:       [null],
      longitude:      [null],
      operatingHours: [''],
    });

    this.systemConfigService.getOrganizationConfig().subscribe({
      next: (config) => {
        this.config = config;
        this.form.patchValue(config);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load organization config.';
      },
    });

    this.loadBranchCenters();
  }

  private loadBranchCenters(): void {
    this.systemConfigService.getBranchCenters().subscribe({
      next: (centers) => (this.branchCenters = centers),
      error: () => {},
    });
  }

  onLogoUploaded(fileId: string): void {
    this.form.patchValue({ logoUuid: fileId });
  }

  onLogoRemoved(): void {
    this.form.patchValue({ logoUuid: null });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = '';

    this.systemConfigService.updateOrganizationConfig(this.form.value).subscribe({
      next: () => {
        this.saving = false;
        this.saved = true;
        setTimeout(() => (this.saved = false), 3000);
      },
      error: () => {
        this.saving = false;
        this.error = 'Failed to save. Please try again.';
      },
    });
  }

  openAddBranch(): void {
    this.editingBranch = null;
    this.branchForm.reset();
    this.branchError = '';
    this.showBranchModal = true;
  }

  openEditBranch(branch: BranchCenter): void {
    this.editingBranch = branch;
    this.branchForm.patchValue(branch);
    this.branchError = '';
    this.showBranchModal = true;
  }

  saveBranch(): void {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }

    this.savingBranch = true;
    this.branchError = '';
    const request: BranchCenterRequest = this.branchForm.value;

    const obs = this.editingBranch
      ? this.systemConfigService.updateBranchCenter(this.editingBranch.id!, request)
      : this.systemConfigService.createBranchCenter(request);

    obs.subscribe({
      next: () => {
        this.savingBranch = false;
        this.showBranchModal = false;
        this.loadBranchCenters();
      },
      error: () => {
        this.savingBranch = false;
        this.branchError = 'Failed to save branch center.';
      },
    });
  }

  deleteBranch(id: string): void {
    if (!confirm('Delete this branch center?')) return;
    this.systemConfigService.deleteBranchCenter(id).subscribe({
      next: () => this.loadBranchCenters(),
      error: () => {},
    });
  }

  closeBranchModal(): void {
    this.showBranchModal = false;
    this.branchError = '';
  }
}
