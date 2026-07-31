import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SystemConfigService } from '../../services/system-config.service';
import { OrganizationConfig } from '../../models/organization-config.model';
import { BranchCenter, BranchCenterRequest } from '../../models/branch-center.model';
import { ProfilePictureUploadComponent } from '../../../../shared/file-upload/profile-picture-upload/profile-picture-upload.component';
import { ToastService } from '../../../../shared/toast/toast.service';
import { PageSplitLayoutComponent } from '../../../../shared/components/page-split-layout/page-split-layout/page-split-layout.component';
import { OrganizationConfigViewComponent } from '../../components/organization-config-view/organization-config-view.component';
import { TabsComponent } from '../../../../shared/tabs/app-tabs/app-tabs.component';
import { TabItem } from '../../../../shared/tabs/models/tab-item.model';
import { CoordinateInputComponent } from '../../../../shared/components/coordinate-input/coordinate-input.component';

@Component({
  selector: 'app-organization-config-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ProfilePictureUploadComponent,
    PageSplitLayoutComponent,
    OrganizationConfigViewComponent,
    TabsComponent,
    CoordinateInputComponent,
  ],
  templateUrl: './organization-config-page.component.html',
})
export class OrganizationConfigPageComponent implements OnInit {
  basicInfoForm!: FormGroup;
  contactForm!: FormGroup;
  aboutForm!: FormGroup;
  branchForm!: FormGroup;

  loading = true;

  activeTab = 'identity';
  tabs: TabItem[] = [
    { key: 'identity', label: 'Identity' },
    { key: 'contact', label: 'Contact Information' },
    { key: 'about', label: 'About Us' },
    { key: 'branches', label: 'Branch Centers' },
  ];

  savingBasic = false;
  savedBasic = false;
  savingContact = false;
  savedContact = false;
  savingAbout = false;
  savedAbout = false;

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
    this.basicInfoForm = this.fb.group({
      name:           ['', [Validators.required, Validators.maxLength(200)]],
      tagline:        ['', Validators.maxLength(500)],
      address:        [''],
      operatingHours: [''],
      logoUuid:       [null],
      coordinates:    [null],
    });

    this.contactForm = this.fb.group({
      email:              ['', Validators.email],
      phone:              [''],
      contactMobilePhone: [''],
      officePhone:        [''],
    });

    this.aboutForm = this.fb.group({
      aboutUs: [''],
    });

    this.branchForm = this.fb.group({
      name:           ['', [Validators.required, Validators.maxLength(200)]],
      address:        [''],
      phone:          [''],
      email:          ['', Validators.email],
      coordinates:    [null],
      operatingHours: [''],
    });

    this.systemConfigService.getOrganizationConfig().subscribe({
      next: (config) => {
        this.config = config;
        this.basicInfoForm.patchValue({
          ...config,
          coordinates: config.latitude != null && config.longitude != null
            ? { latitude: config.latitude, longitude: config.longitude }
            : null,
        });
        this.contactForm.patchValue(config);
        this.aboutForm.patchValue(config);
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
    this.basicInfoForm.patchValue({ logoUuid: fileId });
  }

  onLogoRemoved(): void {
    this.basicInfoForm.patchValue({ logoUuid: null });
  }

  onSaveBasicInfo(): void {
    if (this.basicInfoForm.invalid) {
      this.basicInfoForm.markAllAsTouched();
      return;
    }
    this.savingBasic = true;
    const { coordinates, ...basicFields } = this.basicInfoForm.value;
    const payload = {
      ...basicFields,
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null,
    };
    this.systemConfigService.updateOrganizationBasicInfo(payload).subscribe({
      next: (res) => {
        this.savingBasic = false;
        this.savedBasic = true;
        this.config = res.data ?? this.config;
        setTimeout(() => (this.savedBasic = false), 3000);
        this.toastService.success('Identity info updated successfully');
      },
      error: () => {
        this.savingBasic = false;
      },
    });
  }

  onSaveContact(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }
    this.savingContact = true;
    this.systemConfigService.updateOrganizationContact(this.contactForm.value).subscribe({
      next: (res) => {
        this.savingContact = false;
        this.savedContact = true;
        this.config = res.data ?? this.config;
        setTimeout(() => (this.savedContact = false), 3000);
        this.toastService.success('Contact info updated successfully');
      },
      error: () => {
        this.savingContact = false;
      },
    });
  }

  onSaveAbout(): void {
    this.savingAbout = true;
    this.systemConfigService.updateOrganizationAboutUs(this.aboutForm.value).subscribe({
      next: (res) => {
        this.savingAbout = false;
        this.savedAbout = true;
        this.config = res.data ?? this.config;
        setTimeout(() => (this.savedAbout = false), 3000);
        this.toastService.success('About Us updated successfully');
      },
      error: () => {
        this.savingAbout = false;
      },
    });
  }

  onTabChange(key: string): void {
    this.activeTab = key;
  }

  openAddBranch(): void {
    this.editingBranch = null;
    this.branchForm.reset();
    this.showBranchModal = true;
  }

  openEditBranch(branch: BranchCenter): void {
    this.editingBranch = branch;
    this.branchForm.patchValue({
      ...branch,
      coordinates: branch.latitude != null && branch.longitude != null
        ? { latitude: branch.latitude, longitude: branch.longitude }
        : null,
    });
    this.showBranchModal = true;
  }

  saveBranch(): void {
    if (this.branchForm.invalid) {
      this.branchForm.markAllAsTouched();
      return;
    }

    this.savingBranch = true;
    const { coordinates, ...branchFields } = this.branchForm.value;
    const request: BranchCenterRequest = {
      ...branchFields,
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null,
    };

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
