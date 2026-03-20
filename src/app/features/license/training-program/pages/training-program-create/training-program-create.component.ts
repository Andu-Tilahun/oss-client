import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TrainingProgramStepperComponent } from '../../components/training-program-stepper/training-program-stepper.component';
import {
  OrganizationalQuotaRequest,
  RegionalQuotaRequest,
  TrainingProgram,
  TrainingProgramCreateRequest,
} from '../../models/training.model';
import { TrainingService } from '../../services/training.service';
import { Region } from '../../../../regions/models/region.model';
import { Organization } from '../../../../organizations/models/organization.model';
import { RegionService } from '../../../../regions/services/region.service';
import { OrganizationService } from '../../../../organizations/services/organization.service';

@Component({
  selector: 'app-training-program-create',
  standalone: true,
  imports: [CommonModule, TrainingProgramStepperComponent],
  templateUrl: './training-program-create.component.html',
  styleUrls: ['./training-program-create.component.css'],
})
export class TrainingProgramCreateComponent implements OnInit {
  currentStep = 1;
  program: TrainingProgram | null = null;
  programId: string | null = null;

  regions: Region[] = [];
  organizations: Organization[] = [];

  loadingRegions = false;
  loadingOrganizations = false;
  isSaving = false;

  get isLoading(): boolean {
    return this.loadingRegions || this.loadingOrganizations;
  }

  constructor(
    private trainingService: TrainingService,
    private regionService: RegionService,
    private organizationService: OrganizationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadRegions();
    this.loadOrganizations();
  }

  private loadRegions(): void {
    this.loadingRegions = true;
    this.regionService.getAllRegions().subscribe({
      next: (regions) => {
        this.regions = regions.content;
        this.loadingRegions = false;
      },
      error: (error) => {
        console.error('Error loading regions:', error);
        this.loadingRegions = false;
      },
    });
  }

  private loadOrganizations(): void {
    this.loadingOrganizations = true;
    this.organizationService.getAllOrganizations().subscribe({
      next: (organizations) => {
        this.organizations = organizations.content;
        this.loadingOrganizations = false;
      },
      error: (error) => {
        console.error('Error loading organizations:', error);
        this.loadingOrganizations = false;
      },
    });
  }

  onBasicInfoSubmit(request: TrainingProgramCreateRequest): void {
    this.isSaving = true;
    const save$ = this.programId
      ? this.trainingService.updateProgram(this.programId, request)
      : this.trainingService.createProgram(request);

    save$.subscribe({
      next: (program) => {
        this.program = program;
        this.programId = program.id;
        this.currentStep = 2;
        this.isSaving = false;
      },
      error: (error) => {
        console.error(this.programId ? 'Error updating program:' : 'Error creating program:', error);
        alert(
          (this.programId ? 'Error updating program: ' : 'Error creating program: ')
          + (error.error?.message || error.message),
        );
        this.isSaving = false;
      },
    });
  }

  onRegionalQuotaSubmit(request: RegionalQuotaRequest): void {
    if (!this.programId) {
      return;
    }

    this.isSaving = true;
    this.trainingService.assignRegionalQuota(this.programId, request).subscribe({
      next: (program) => {
        this.program = program;
        this.currentStep = 3;
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error assigning regional quota:', error);
        alert('Error: ' + (error.error?.message || error.message));
        this.isSaving = false;
      },
    });
  }

  onOrganizationalQuotaSubmit(request: OrganizationalQuotaRequest): void {
    if (!this.programId) {
      return;
    }

    this.isSaving = true;
    this.trainingService.assignOrganizationalQuota(this.programId, request).subscribe({
      next: (program) => {
        this.program = program;
        this.currentStep = 4;
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error assigning organizational quota:', error);
        alert('Error: ' + (error.error?.message || error.message));
        this.isSaving = false;
      },
    });
  }

  onConfirm(): void {
    this.publishProgram();
  }

  private publishProgram(): void {
    if (!this.programId) {
      return;
    }

    this.trainingService.publishProgram(this.programId).subscribe({
      next: () => {
        this.isSaving = false;
        alert('Training program created and published successfully!');
        this.router.navigate(['/training-programs']);
      },
      error: (error) => {
        console.error('Error publishing program:', error);
        this.isSaving = false;
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/training-programs']);
  }
}

