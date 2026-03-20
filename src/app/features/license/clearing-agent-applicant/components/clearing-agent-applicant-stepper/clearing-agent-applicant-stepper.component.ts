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
import { DocumentUploadComponent } from '../../../../../shared/file-upload/document-upload/document-upload.component';
import { RepeaterComponent } from '../../../../../shared/repeater/repeater/repeater.component';
import { StepperComponent, StepConfig } from '../../../../../shared/components/stepper/stepper.component';
import {
  ClearingAgentApplicant,
  ClearingAgentApplicantCreateRequest,
  ClearingAgentDocumentRequest,
  ClearingAgentApplicantType,
  ClearingAgentDocumentType,
} from '../../models/clearing-agent-applicant.model';
import { TrainingProgram } from '../../../training-program/models/training.model';

type DocDef = { type: ClearingAgentDocumentType; label: string; required: boolean };

const DOC_DEFS: DocDef[] = [
  { type: 'CERTIFICATE', label: 'Certificate', required: true },
  { type: 'WORK_EXPERIENCE', label: 'Work Experience', required: true },
  { type: 'NATIONAL_ID', label: 'National ID', required: true },
  { type: 'OTHER', label: 'Other (optional)', required: false },
];

@Component({
  selector: 'app-clearing-agent-applicant-stepper',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DocumentUploadComponent, RepeaterComponent, StepperComponent],
  templateUrl: './clearing-agent-applicant-stepper.component.html',
  styleUrls: ['./clearing-agent-applicant-stepper.component.css'],
})
export class ClearingAgentApplicantStepperComponent implements OnInit, OnChanges {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() applicant: ClearingAgentApplicant | null = null;
  @Input() trainingPrograms: TrainingProgram[] = [];
  @Input() fullPage = true;
  @Input() lockedApplicantType: ClearingAgentApplicantType | null = null;
  @Input() lockedExternalId: string | null = null;
  @Input() applicantTypeOptions: ClearingAgentApplicantType[] = [
    'PRIVATE',
    'FORMER_EMPLOYEE',
    'REGIONAL',
    'ORGANIZATIONAL',
  ];
  @Input() isLoading = false;
  @Input() isSaving = false;
  @Input() currentStep = 1;

  @Output() currentStepChange = new EventEmitter<number>();
  @Output() applicantInfoSubmit = new EventEmitter<ClearingAgentApplicantCreateRequest>();
  @Output() documentsSubmit = new EventEmitter<ClearingAgentDocumentRequest[]>();
  @Output() submitRequested = new EventEmitter<void>();
  @Output() cancelRequested = new EventEmitter<void>();

  applicantForm!: FormGroup;
  documentsForm!: FormGroup;

  readonly docDefs = DOC_DEFS;
  readonly steps: StepConfig[] = [
    { label: 'Applicant', description: 'Personal details', clickable: true },
    { label: 'Documents', description: 'Upload required files', clickable: true },
    { label: 'Summary', description: 'Review & submit', clickable: false },
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForms();
    this.initializeDocumentRows();
    this.applicantForm.get('applicantType')?.valueChanges.subscribe(() => {
      this.updateExternalIdValidator();
    });
    this.updateExternalIdValidator();
    this.applyLocks();
    if (this.applicant) {
      this.patchApplicant();
      this.patchDocuments();
      this.applyLocks();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['applicant'] && this.applicant && this.applicantForm) {
      this.patchApplicant();
      this.patchDocuments();
    }
    if ((changes['lockedApplicantType'] || changes['lockedExternalId']) && this.applicantForm) {
      this.applyLocks();
    }
  }

  private initializeForms(): void {
    this.applicantForm = this.fb.group({
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      gender: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      photoId: [''],
      email: ['', Validators.email],
      phoneNumber: [''],
      applicantType: ['PRIVATE', Validators.required],
      trainingProgramId: ['', Validators.required],
      externalId: [''],
    });

    this.documentsForm = this.fb.group({
      documents: this.fb.array([]),
    });
  }

  private updateExternalIdValidator(): void {
    const ctrl = this.applicantForm.get('externalId');
    if (!ctrl) return;
    if (this.requiresExternalId) {
      ctrl.setValidators([Validators.required]);
    } else {
      ctrl.clearValidators();
      ctrl.setValue('', { emitEvent: false });
    }
    ctrl.updateValueAndValidity({ emitEvent: false });
  }

  private applyLocks(): void {
    const applicantTypeCtrl = this.applicantForm?.get('applicantType');
    if (applicantTypeCtrl) {
      if (this.lockedApplicantType) {
        applicantTypeCtrl.setValue(this.lockedApplicantType, { emitEvent: true });
        applicantTypeCtrl.disable({ emitEvent: false });
      } else if (applicantTypeCtrl.disabled) {
        applicantTypeCtrl.enable({ emitEvent: false });
      }
    }

    const externalIdCtrl = this.applicantForm?.get('externalId');
    if (externalIdCtrl) {
      if (this.lockedExternalId) {
        externalIdCtrl.setValue(this.lockedExternalId, { emitEvent: false });
        externalIdCtrl.disable({ emitEvent: false });
      } else if (externalIdCtrl.disabled) {
        externalIdCtrl.enable({ emitEvent: false });
      }
    }
  }

  private initializeDocumentRows(): void {
    const arr = this.documentsArray;
    if (arr.length) return;
    DOC_DEFS.forEach((d) => {
      arr.push(
        this.fb.group({
          documentType: [d.type, Validators.required],
          attachmentId: ['', d.required ? Validators.required : []],
        }),
      );
    });
  }

  private patchApplicant(): void {
    if (!this.applicant) return;
    const a = this.applicant;
    const toDateStr = (val?: string) => (val ? val.split('T')[0] : '');

    this.applicantForm.patchValue({
      firstName: a.firstName,
      middleName: a.middleName ?? '',
      lastName: a.lastName,
      gender: a.gender,
      dateOfBirth: toDateStr(a.dateOfBirth),
      photoId: a.photoId ?? '',
      email: a.email ?? '',
      phoneNumber: a.phoneNumber ?? '',
      applicantType: a.applicantType,
      trainingProgramId: a.trainingProgramId,
      externalId: a.externalId ?? '',
    });
  }

  private patchDocuments(): void {
    if (!this.applicant) return;
    const docs = this.applicant.documents ?? [];
    const map = new Map<ClearingAgentDocumentType, string>();
    docs.forEach((d) => {
      if (d.documentType && d.attachmentId) {
        map.set(d.documentType, d.attachmentId);
      }
    });

    this.documentsArray.controls.forEach((ctrl) => {
      const t = ctrl.get('documentType')?.value as ClearingAgentDocumentType;
      const fileId = map.get(t) ?? '';
      ctrl.patchValue({ attachmentId: fileId });
    });
  }

  get documentsArray(): FormArray {
    return this.documentsForm.get('documents') as FormArray;
  }

  get selectedApplicantType(): ClearingAgentApplicantType {
    return this.applicantForm.get('applicantType')?.value as ClearingAgentApplicantType;
  }

  get requiresExternalId(): boolean {
    return this.selectedApplicantType === 'REGIONAL' || this.selectedApplicantType === 'ORGANIZATIONAL';
  }

  onDocUploaded(index: number, fileId: string): void {
    this.documentsArray.at(index).patchValue({ attachmentId: fileId });
    this.documentsArray.at(index).get('attachmentId')?.markAsTouched();
  }

  onDocRemoved(index: number): void {
    this.documentsArray.at(index).patchValue({ attachmentId: '' });
    this.documentsArray.at(index).get('attachmentId')?.markAsTouched();
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      if (this.applicantForm.valid && this.hasAvailableQuotaForSelection) {
        const req = this.applicantForm.value as ClearingAgentApplicantCreateRequest;
        this.applicantInfoSubmit.emit(req);
      } else {
        this.markFormGroupTouched(this.applicantForm);
      }
      return;
    }

    if (this.currentStep === 2) {
      if (this.documentsForm.valid) {
        const docs: ClearingAgentDocumentRequest[] = this.documentsArray.value
          .filter((d: any) => !!d?.attachmentId) // drop empty OTHER
          .map((d: any) => ({ documentType: d.documentType, attachmentId: d.attachmentId }));
        this.documentsSubmit.emit(docs);
      } else {
        this.markFormGroupTouched(this.documentsForm);
      }
      return;
    }

    if (this.currentStep === 3) {
      this.submitRequested.emit();
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

  cancel(): void {
    this.cancelRequested.emit();
  }

  documentLabel(type: ClearingAgentDocumentType): string {
    return DOC_DEFS.find((d) => d.type === type)?.label ?? type;
  }

  documentRequired(type: ClearingAgentDocumentType): boolean {
    return !!DOC_DEFS.find((d) => d.type === type)?.required;
  }

  getSelectedTrainingProgramTitle(): string {
    const id = this.applicantForm?.get('trainingProgramId')?.value;
    if (!id) return '';
    const p = (this.trainingPrograms ?? []).find((tp) => tp.id === id);
    return p?.title || String(id);
  }

  getSelectedTrainingProgram(): TrainingProgram | null {
    const id = this.applicantForm?.get('trainingProgramId')?.value;
    if (!id) return null;
    return (this.trainingPrograms ?? []).find((tp) => tp.id === id) ?? null;
  }

  get hasAvailableQuotaForSelection(): boolean {
    const program = this.getSelectedTrainingProgram();
    if (!program) return true;
    return this.hasAvailableQuotaForProgram(program);
  }

  hasAvailableQuotaForProgram(program: TrainingProgram): boolean {
    if (!program) return true;
    const type = this.selectedApplicantType;
    if (type === 'PRIVATE') return Number(program.privateQuota ?? 0) > 0;
    if (type === 'FORMER_EMPLOYEE') return Number(program.formerEmployeeQuota ?? 0) > 0;

    const externalId = String(this.applicantForm?.get('externalId')?.value ?? '').trim();
    if (type === 'REGIONAL') {
      if (!program.regionalQuotaEnabled) return false;
      if (!externalId) return false;
      const q = (program.quotas ?? []).find((x) => x.quotaType === 'REGIONAL' && x.externalId === externalId);
      if (!q) return false;
      return Number(q.quota ?? 0) - Number(q.usedQuota ?? 0) > 0;
    }

    if (type === 'ORGANIZATIONAL') {
      if (!program.organizationalQuotaEnabled) return false;
      if (!externalId) return false;
      const q = (program.quotas ?? []).find((x) => x.quotaType === 'ORGANIZATIONAL' && x.externalId === externalId);
      if (!q) return false;
      return Number(q.quota ?? 0) - Number(q.usedQuota ?? 0) > 0;
    }

    return true;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
      if (control instanceof FormArray) {
        control.controls.forEach((c) => {
          if (c instanceof FormGroup) this.markFormGroupTouched(c);
          else c.markAsTouched();
        });
      }
    });
  }
}

