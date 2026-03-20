import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
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
  selector: 'app-training-program-edit-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, TrainingProgramStepperComponent, ModalComponent],
  templateUrl: './training-program-edit-modal.component.html',
})
export class TrainingProgramEditModalComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() programId: string | null = null;
  @Input() program: TrainingProgram | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() programUpdated = new EventEmitter<void>();

  currentStep = 1;

  regions: Region[] = [];
  organizations: Organization[] = [];

  loadingProgram = false;
  loadingRegions = false;
  loadingOrganizations = false;
  isSaving = false;

  get isLoading(): boolean {
    // Don't block form when we already have program data (e.g. from parent)
    const waitingForProgram = this.loadingProgram && !this.program;
    return waitingForProgram || this.loadingRegions || this.loadingOrganizations;
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

  ngOnChanges(changes: SimpleChanges): void {
    // When modal opens: reload program and reset to step 1
    if (changes['visible']?.currentValue === true && this.programId) {
      this.currentStep = 1;
      this.loadProgram();
    }
  }

  private loadProgram(): void {
    if (!this.programId) {
      return;
    }
    this.loadingProgram = true;
    this.trainingService.getProgram(this.programId).subscribe({
      next: (program) => {
        this.program = program;
        this.loadingProgram = false;
      },
      error: (error) => {
        console.error('Error loading program:', error);
        this.loadingProgram = false;
      },
    });
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
    if (!this.programId) {
      return;
    }

    this.isSaving = true;
    this.trainingService.updateProgram(this.programId, request).subscribe({
      next: (program) => {
        this.program = program;
        this.currentStep = 2;
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error updating program:', error);
        alert('Error: ' + (error.error?.message || error.message));
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
    alert('Training program updated successfully!');
    this.onCompleted();
    this.programUpdated.emit();
  }

  onCompleted(): void {
    this.visible = false;
    this.visibleChange.emit(false);
  }
}

