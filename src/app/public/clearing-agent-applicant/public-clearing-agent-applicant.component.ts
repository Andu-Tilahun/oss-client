import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ToastService } from '../../shared/toast/toast.service';
import { TrainingService } from '../../features/license/training-program/services/training.service';
import { TrainingProgram, TrainingStatus } from '../../features/license/training-program/models/training.model';
import { ClearingAgentApplicantService } from '../../features/license/clearing-agent-applicant/services/clearing-agent-applicant.service';
import {
  ClearingAgentApplicant,
  ClearingAgentApplicantCreateRequest,
  ClearingAgentApplicantType,
  ClearingAgentDocumentRequest,
} from '../../features/license/clearing-agent-applicant/models/clearing-agent-applicant.model';
import { ClearingAgentApplicantStepperComponent } from '../../features/license/clearing-agent-applicant/components/clearing-agent-applicant-stepper/clearing-agent-applicant-stepper.component';
import {
  ReferenceChoice,
  ReferenceNumberChoiceComponent,
} from '../../shared/components/reference-number-choice/reference-number-choice.component';
import { PageResponse } from '../../shared/models/api-response.model';

type PublicMode = 'choose' | 'new' | 'edit';

@Component({
  selector: 'app-public-clearing-agent-applicant',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ClearingAgentApplicantStepperComponent,
    ReferenceNumberChoiceComponent,
  ],
  templateUrl: './public-clearing-agent-applicant.component.html',
})
export class PublicClearingAgentApplicantComponent implements OnInit {
  @Input() initialMode: PublicMode = 'choose';

  mode: PublicMode = 'choose';

  readonly publicApplicantTypeOptions: ClearingAgentApplicantType[] = ['PRIVATE', 'FORMER_EMPLOYEE'];
  choice: ReferenceChoice | null = null;

  trainingPrograms: TrainingProgram[] = [];
  applicant: ClearingAgentApplicant | null = null;
  applicantId: string | null = null;

  currentStep = 1;
  loading = false;
  saving = false;

  get stepperMode(): 'create' | 'edit' {
    return this.applicantId ? 'edit' : 'create';
  }

  constructor(
    private fb: FormBuilder,
    private trainingService: TrainingService,
    private applicantService: ClearingAgentApplicantService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.mode = this.initialMode;
    this.loadTrainingPrograms();
  }

  onChoiceChange(next: ReferenceChoice): void {
    this.choice = next;
    this.mode = next === 'existing' ? 'edit' : 'new';
    this.applicant = null;
    this.applicantId = null;
    this.currentStep = 1;
  }

  reset(): void {
    this.mode = 'choose';
    this.choice = null;
    this.applicant = null;
    this.applicantId = null;
    this.currentStep = 1;
  }

  private loadTrainingPrograms(): void {
    this.loading = true;
    this.trainingService
      .filterPrograms({
        page: 0,
        size: 100,
             })
      .subscribe({
        next: (response: PageResponse<TrainingProgram>) => {
          const programs = response?.content ?? [];
          this.trainingPrograms = programs;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  lookup(referenceNumber: string): void {
    const ref = String(referenceNumber ?? '').trim();
    if (!ref) return;
    this.loading = true;
    this.applicantService.getByReferenceNumber(ref).subscribe({
      next: (a) => {
        this.applicant = a;
        this.applicantId = a.id;
        this.currentStep = 1;
        this.toast.success('Application loaded');
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onApplicantInfoSubmit(request: ClearingAgentApplicantCreateRequest): void {
    this.saving = true;
    const save$ = this.applicantId
      ? this.applicantService.update(this.applicantId, request)
      : this.applicantService.create(request);

    save$.subscribe({
      next: (a) => {
        this.applicant = a;
        this.applicantId = a.id;
        this.currentStep = 2;
        if (a.referenceNumber) {
          this.toast.success(`Reference Number: ${a.referenceNumber}`, 'Saved');
        }
        this.saving = false;
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  onDocumentsSubmit(documents: ClearingAgentDocumentRequest[]): void {
    if (!this.applicantId) return;
    this.saving = true;
    this.applicantService.saveDocuments(this.applicantId, documents).subscribe({
      next: (a) => {
        this.applicant = a;
        this.currentStep = 3;
        this.saving = false;
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  onSubmit(): void {
    if (!this.applicantId) return;
    this.saving = true;
    this.applicantService.submit(this.applicantId).subscribe({
      next: (a) => {
        this.applicant = a;
        this.saving = false;
        this.toast.success(`Submitted. Reference Number: ${a.referenceNumber}`, 'Done');
        this.reset();
      },
      error: () => {
        this.saving = false;
      },
    });
  }
}

