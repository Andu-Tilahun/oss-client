import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SystemConfigService } from '../../services/system-config.service';
import { OrganizationConfig } from '../../models/organization-config.model';
import { BranchCenter, BranchCenterRequest } from '../../models/branch-center.model';
import { ProfilePictureUploadComponent } from '../../../../shared/file-upload/profile-picture-upload/profile-picture-upload.component';
import { ToastService } from '../../../../shared/toast/toast.service';

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

  config: OrganizationConfig | null = null;

  branchCenters: BranchCenter[] = [];
  showBranchModal = false;
  editingBranch: BranchCenter | null = null;
  savingBranch = false;

  constructor(
    private fb: FormBuilder,
    private systemConfigService: SystemConfigService,
    private toastService: ToastService,
  ) {}

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

    this.systemConfigService.updateOrganizationConfig(this.form.value).subscribe({
      next: () => {
        this.saving = false;
        this.saved = true;
        setTimeout(() => (this.saved = false), 3000);
        this.toastService.success('Organization settings updated successfully');
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  openAddBranch(): void {
    this.editingBranch = null;
    this.branchForm.reset();
    this.showBranchModal = true;
  }

  openEditBranch(branch: BranchCenter): void {
    this.editingBranch = branch;
    this.branchForm.patchValue(branch);
    this.showBranchModal = true;
  }

  saveBranch(): void {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }

    this.savingBranch = true;
    const request: BranchCenterRequest = this.branchForm.value;

    const obs = this.editingBranch
      ? this.systemConfigService.updateBranchCenter(this.editingBranch.id!, request)
      : this.systemConfigService.createBranchCenter(request);

    obs.subscribe({
      next: () => {
        this.savingBranch = false;
        this.showBranchModal = false;
        this.loadBranchCenters();
        this.toastService.success(this.editingBranch ? 'Branch center updated' : 'Branch center created');
      },
      error: () => {
        this.savingBranch = false;
      },
    });
  }

  deleteBranch(id: string): void {
    if (!confirm('Delete this branch center?')) return;
    this.systemConfigService.deleteBranchCenter(id).subscribe({
      next: () => {
        this.loadBranchCenters();
        this.toastService.success('Branch center deleted');
      },
      error: () => {},
    });
  }

  closeBranchModal(): void {
    this.showBranchModal = false;
  }
}
