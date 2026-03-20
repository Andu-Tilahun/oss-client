import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  OrganizationalQuotaRequest,
  QuotaAssignment,
  RegionalQuotaRequest,
  TrainingProgram,
  TrainingProgramCreateRequest,
} from '../../models/training.model';
import { Region } from '../../../../regions/models/region.model';
import { Organization } from '../../../../organizations/models/organization.model';
import { StepperComponent, StepConfig } from '../../../../../shared/components/stepper/stepper.component';

@Component({
  selector: 'app-training-program-stepper',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StepperComponent],
  templateUrl: './training-program-stepper.component.html',
  styleUrls: ['./training-program-stepper.component.css'],
})
export class TrainingProgramStepperComponent implements OnInit, OnChanges {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() programId: string | null = null;
  @Input() program: TrainingProgram | null = null;
  @Input() regions: Region[] = [];
  @Input() organizations: Organization[] = [];
  @Input() isLoading = false;
  @Input() isSaving = false;
  @Input() currentStep = 1;

  @Output() currentStepChange = new EventEmitter<number>();
  @Output() basicInfoSubmit = new EventEmitter<TrainingProgramCreateRequest>();
  @Output() regionalQuotaSubmit = new EventEmitter<RegionalQuotaRequest>();
  @Output() organizationalQuotaSubmit = new EventEmitter<OrganizationalQuotaRequest>();
  @Output() cancelRequested = new EventEmitter<void>();
  @Output() completed = new EventEmitter<void>();

  basicInfoForm!: FormGroup;
  regionalQuotaForm!: FormGroup;
  organizationalQuotaForm!: FormGroup;

  readonly steps: StepConfig[] = [
    { label: 'Basic Info', description: 'Program details', clickable: true },
    { label: 'Regional Quota', description: 'Assign by region', clickable: true },
    { label: 'Organization Quota', description: 'Assign by organization', clickable: true },
    { label: 'Summary', description: 'Review & confirm', clickable: true },
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForms();
    // Patch form when program is already available (e.g. edit mode - program arrives before/during init)
    if (this.program) {
      this.patchProgramData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['program'] && this.program && this.basicInfoForm) {
      this.patchProgramData();
    }

    if (changes['regions'] && this.regions?.length && !this.regionalQuotas.length) {
      this.initializeRegionalQuotas();
    }

    if (
      changes['organizations'] &&
      this.organizations?.length &&
      !this.organizationalQuotas.length
    ) {
      this.initializeOrganizationalQuotas();
    }
  }

  private initializeForms(): void {
    this.basicInfoForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(200)]],
      registrationStartDate: ['', Validators.required],
      registrationEndDate: ['', Validators.required],
      trainingStartDate: ['', Validators.required],
      trainingEndDate: ['', Validators.required],
      privateQuota: [0, [Validators.required, Validators.min(0)]],
      formerEmployeeQuota: [0, [Validators.required, Validators.min(0)]],
    });

    this.regionalQuotaForm = this.fb.group({
      enabled: [false],
      quotas: this.fb.array([]),
    });

    this.organizationalQuotaForm = this.fb.group({
      enabled: [false],
      quotas: this.fb.array([]),
    });
  }

  private patchProgramData(): void {
    if (!this.program || !this.basicInfoForm) {
      return;
    }
    const program = this.program;
    // Normalize dates to yyyy-MM-dd for HTML date inputs
    const toDateStr = (val: string | undefined) =>
      val ? val.split('T')[0] : '';
    this.basicInfoForm.patchValue({
      title: program.title,
      registrationStartDate: toDateStr(program.registrationStartDate),
      registrationEndDate: toDateStr(program.registrationEndDate),
      trainingStartDate: toDateStr(program.trainingStartDate),
      trainingEndDate: toDateStr(program.trainingEndDate),
      privateQuota: program.privateQuota ?? 0,
      formerEmployeeQuota: program.formerEmployeeQuota ?? 0,
    });
    this.regionalQuotaForm.patchValue({ enabled: program.regionalQuotaEnabled });
    this.organizationalQuotaForm.patchValue({
      enabled: program.organizationalQuotaEnabled,
    });
    if (this.regions?.length) {
      this.initializeRegionalQuotas();
    }
    if (this.organizations?.length) {
      this.initializeOrganizationalQuotas();
    }
  }

  private initializeRegionalQuotas(): void {
    const quotasArray = this.regionalQuotaForm.get('quotas') as FormArray;
    quotasArray.clear();

    this.regions.forEach((region) => {
      let initialQuota = 0;

      if (this.program?.quotas) {
        const existingQuota = this.program.quotas.find(
          (q) => q.quotaType === 'REGIONAL' && q.externalId === region.id,
        );
        initialQuota = existingQuota?.quota || 0;
      }

      quotasArray.push(
        this.fb.group({
          externalId: [region.id],
          externalName: [region.name],
          quota: [initialQuota, [Validators.min(0)]],
        }),
      );
    });
  }

  private initializeOrganizationalQuotas(): void {
    const quotasArray = this.organizationalQuotaForm.get('quotas') as FormArray;
    quotasArray.clear();

    this.organizations.forEach((org) => {
      let initialQuota = 0;

      if (this.program?.quotas) {
        const existingQuota = this.program.quotas.find(
          (q) => q.quotaType === 'ORGANIZATIONAL' && q.externalId === org.id,
        );
        initialQuota = existingQuota?.quota || 0;
      }

      quotasArray.push(
        this.fb.group({
          externalId: [org.id],
          externalName: [org.name],
          quota: [initialQuota, [Validators.min(0)]],
        }),
      );
    });
  }

  get regionalQuotas(): FormArray {
    return this.regionalQuotaForm.get('quotas') as FormArray;
  }

  get organizationalQuotas(): FormArray {
    return this.organizationalQuotaForm.get('quotas') as FormArray;
  }

  get regionalQuotaEnabled(): boolean {
    return this.regionalQuotaForm.get('enabled')?.value;
  }

  get organizationalQuotaEnabled(): boolean {
    return this.organizationalQuotaForm.get('enabled')?.value;
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      if (this.basicInfoForm.valid) {
        const request: TrainingProgramCreateRequest = this.basicInfoForm.value;
        this.basicInfoSubmit.emit(request);
      } else {
        this.markFormGroupTouched(this.basicInfoForm);
      }
    } else if (this.currentStep === 2) {
      const enabled = this.regionalQuotaForm.get('enabled')?.value;
      const quotaValues: QuotaAssignment[] = this.regionalQuotas.value
        .filter((q: any) => q.quota > 0)
        .map((q: any) => ({ externalId: q.externalId, quota: q.quota }));

      const request: RegionalQuotaRequest = {
        enabled,
        quotas: enabled ? quotaValues : [],
      };

      this.regionalQuotaSubmit.emit(request);
    } else if (this.currentStep === 3) {
      const enabled = this.organizationalQuotaForm.get('enabled')?.value;
      const quotaValues: QuotaAssignment[] = this.organizationalQuotas.value
        .filter((q: any) => q.quota > 0)
        .map((q: any) => ({ externalId: q.externalId, quota: q.quota }));

      const request: OrganizationalQuotaRequest = {
        enabled,
        quotas: enabled ? quotaValues : [],
      };

      this.organizationalQuotaSubmit.emit(request);
    } else if (this.currentStep === 4) {
      this.completed.emit();
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStepChange.emit(this.currentStep - 1);
    }
  }

  goToStep(step: number): void {
    if (step < this.currentStep) {
      this.currentStepChange.emit(step);
    }
  }

  getTotalRegionalQuota(): number {
    if (!this.regionalQuotaEnabled) {
      return 0;
    }

    return this.regionalQuotas.controls.reduce((total, control) => {
      const quota = control.get('quota')?.value || 0;
      return total + Number(quota);
    }, 0);
  }

  getTotalOrganizationalQuota(): number {
    if (!this.organizationalQuotaEnabled) {
      return 0;
    }

    return this.organizationalQuotas.controls.reduce((total, control) => {
      const quota = control.get('quota')?.value || 0;
      return total + Number(quota);
    }, 0);
  }

  getTotalQuota(): number {
    const privateQuota = Number(this.basicInfoForm.get('privateQuota')?.value) || 0;
    const formerEmployeeQuota =
      Number(this.basicInfoForm.get('formerEmployeeQuota')?.value) || 0;
    const regionalQuota = this.getTotalRegionalQuota();
    const organizationalQuota = this.getTotalOrganizationalQuota();

    return privateQuota + formerEmployeeQuota + regionalQuota + organizationalQuota;
  }

  cancel(): void {
    this.cancelRequested.emit();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}

