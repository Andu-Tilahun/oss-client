import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrainingProgramStepperComponent } from '../../components/training-program-stepper/training-program-stepper.component';
import { ModalComponent } from '../../../../../shared/modals/modal/modal.component';
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
  selector: 'app-training-program-create-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, TrainingProgramStepperComponent, ModalComponent],
  templateUrl: './training-program-create-modal.component.html',
})
export class TrainingProgramCreateModalComponent implements OnInit {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() programCreated = new EventEmitter<void>();

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
        this.onCompleted();
        this.programCreated.emit();
      },
      error: (error) => {
        console.error('Error publishing program:', error);
        this.isSaving = false;
      },
    });
  }

  onCompleted(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}

