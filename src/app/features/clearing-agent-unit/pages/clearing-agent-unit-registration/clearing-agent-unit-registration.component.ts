import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { from, of } from 'rxjs';
import { catchError, concatMap, finalize, toArray } from 'rxjs/operators';

import { AuthService } from '../../../auth/services/auth.service';
import { ToastService } from '../../../../shared/toast/toast.service';
import { TrainingService } from '../../../license/training-program/services/training.service';
import { TrainingProgram, TrainingStatus } from '../../../license/training-program/models/training.model';
import { PageResponse } from '../../../../shared/models/api-response.model';
import {
  ClearingAgentApplicant,
  ClearingAgentApplicantCreateRequest,
  ClearingAgentApplicantType,
  ClearingAgentDocumentRequest,
} from '../../../license/clearing-agent-applicant/models/clearing-agent-applicant.model';
import { ClearingAgentApplicantService } from '../../../license/clearing-agent-applicant/services/clearing-agent-applicant.service';
import { ClearingAgentApplicantStepperComponent } from '../../../license/clearing-agent-applicant/components/clearing-agent-applicant-stepper/clearing-agent-applicant-stepper.component';
import { User } from '../../../users/models/user.model';

type UnitRow = {
  applicant: ClearingAgentApplicant;
  selected: boolean;
};

@Component({
  selector: 'app-clearing-agent-unit-registration',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ClearingAgentApplicantStepperComponent],
  templateUrl: './clearing-agent-unit-registration.component.html',
})
export class ClearingAgentUnitRegistrationComponent implements OnInit {
  user: User | null = null;

  applicantType: ClearingAgentApplicantType | null = null;
  externalId: string | null = null;

  loadingPrograms = false;
  savingApplicant = false;
  sendingUnit = false;

  allPrograms: TrainingProgram[] = [];
  trainingPrograms: TrainingProgram[] = [];

  currentStep = 1;
  applicant: ClearingAgentApplicant | null = null;
  applicantId: string | null = null;

  rows: UnitRow[] = [];

  constructor(
    private auth: AuthService,
    private trainingService: TrainingService,
    private applicantService: ClearingAgentApplicantService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.user = this.auth.getCurrentUser();
    this.resolveContext();
    this.loadPrograms();
  }

  private resolveContext(): void {
    const u = this.user;
    if (!u) return;

    if (u.organizationId) {
      this.applicantType = 'ORGANIZATIONAL';
      this.externalId = u.organizationId;
      return;
    }

    if (u.regionId) {
      this.applicantType = 'REGIONAL';
      this.externalId = u.regionId;
      return;
    }
  }

  get canUsePage(): boolean {
    return !!this.user && !!this.applicantType && !!this.externalId;
  }

  get hasQuotaPrograms(): boolean {
    return (this.trainingPrograms ?? []).length > 0;
  }

  private loadPrograms(): void {
    if (!this.canUsePage) return;

    this.loadingPrograms = true;
    this.trainingService
      .filterPrograms({
        page: 0,
        size: 200,
        // statuses: [TrainingStatus.PUBLISHED],
      })
      .pipe(finalize(() => (this.loadingPrograms = false)))
      .subscribe({
        next: (res: PageResponse<TrainingProgram>) => {
          const programs: TrainingProgram[] = res?.content ?? [];
          this.allPrograms = programs;
          this.recomputeAvailablePrograms();
        },
        error: () => {
          this.toast.error('Failed to load training programs');
        },
      });
  }

  private recomputeAvailablePrograms(): void {
    this.trainingPrograms = (this.allPrograms ?? []).filter((p) => this.getAvailableQuota(p) > 0);
  }

  private getAvailableQuota(program: TrainingProgram): number {
    if (!this.applicantType || !this.externalId) return 0;
    const pending = this.rows.filter((r) => r.applicant.trainingProgramId === program.id).length;

    if (this.applicantType === 'REGIONAL') {
      if (!program.regionalQuotaEnabled) return 0;
      console.log(program)
      const q = (program.quotas ?? []).find((x) => x.quotaType === 'REGIONAL' && x.externalId === this.externalId);
      console.log(q)

      if (!q) return 0;
      return Math.max(0, Number(q.quota ?? 0) - Number(q.usedQuota ?? 0) - pending);
    }

    if (this.applicantType === 'ORGANIZATIONAL') {
      if (!program.organizationalQuotaEnabled) return 0;
      const q = (program.quotas ?? []).find((x) => x.quotaType === 'ORGANIZATIONAL' && x.externalId === this.externalId);
      if (!q) return 0;
      return Math.max(0, Number(q.quota ?? 0) - Number(q.usedQuota ?? 0) - pending);
    }

    return 0;
  }

  private getAvailableQuotaByProgramId(programId: string): number {
    const p = (this.allPrograms ?? []).find((x) => x.id === programId);
    return p ? this.getAvailableQuota(p) : 0;
  }

  onApplicantInfoSubmit(req: ClearingAgentApplicantCreateRequest): void {
    if (!this.canUsePage || !this.applicantType || !this.externalId) return;

    const request: ClearingAgentApplicantCreateRequest = {
      ...req,
      applicantType: this.applicantType,
      externalId: this.externalId,
    };

    const available = this.getAvailableQuotaByProgramId(request.trainingProgramId);
    if (available <= 0) {
      this.toast.error('No available quota for the selected training program');
      this.recomputeAvailablePrograms();
      return;
    }

    this.savingApplicant = true;
    const save$ = this.applicantId
      ? this.applicantService.update(this.applicantId, request)
      : this.applicantService.create(request);

    save$
      .pipe(finalize(() => (this.savingApplicant = false)))
      .subscribe({
        next: (a) => {
          this.applicant = a;
          this.applicantId = a.id;
          this.currentStep = 2;
        },
        error: () => {
          this.toast.error('Failed to save applicant');
        },
      });
  }

  onDocumentsSubmit(documents: ClearingAgentDocumentRequest[]): void {
    if (!this.applicantId) return;
    this.savingApplicant = true;
    this.applicantService
      .saveDocuments(this.applicantId, documents)
      .pipe(finalize(() => (this.savingApplicant = false)))
      .subscribe({
        next: (a) => {
          this.applicant = a;
          this.currentStep = 3;
        },
        error: () => {
          this.toast.error('Failed to save documents');
        },
      });
  }

  onFinalizeApplicant(): void {
    if (!this.applicantId || !this.applicant) return;

    const idx = this.rows.findIndex((r) => r.applicant.id === this.applicantId);
    if (idx >= 0) {
      this.rows[idx] = { ...this.rows[idx], applicant: this.applicant };
      this.toast.success('Applicant updated in the list');
    } else {
      this.rows = [{ applicant: this.applicant, selected: true }, ...this.rows];
      this.toast.success('Applicant added to the list');
    }

    this.resetStepper();
    this.recomputeAvailablePrograms();
  }

  resetStepper(): void {
    this.currentStep = 1;
    this.applicant = null;
    this.applicantId = null;
  }

  editRow(row: UnitRow): void {
    this.applicant = row.applicant;
    this.applicantId = row.applicant.id;
    this.currentStep = 1;
  }

  toggleSelectAll(checked: boolean): void {
    this.rows = (this.rows ?? []).map((r) => ({ ...r, selected: checked }));
  }

  get allSelected(): boolean {
    return this.rows.length > 0 && this.rows.every((r) => r.selected);
  }

  get selectedCount(): number {
    return this.rows.filter((r) => r.selected).length;
  }

  sendSelectedAsUnit(): void {
    const selected = this.rows.filter((r) => r.selected).map((r) => r.applicant);
    if (!selected.length) {
      this.toast.error('Select at least one agent to send');
      return;
    }

    this.sendingUnit = true;
    const succeeded: string[] = [];
    const failed: string[] = [];

    from(selected)
      .pipe(
        concatMap((a) =>
          this.applicantService.submit(a.id).pipe(
            catchError(() => {
              failed.push(a.id);
              return of(null);
            }),
          ),
        ),
        toArray(),
        finalize(() => (this.sendingUnit = false)),
      )
      .subscribe({
        next: (results) => {
          (results ?? []).forEach((r: any) => {
            if (r?.id) succeeded.push(r.id);
          });

          if (succeeded.length) {
            this.rows = this.rows.filter((r) => !succeeded.includes(r.applicant.id));
          }

          if (failed.length) {
            this.toast.error(`${failed.length} agent(s) failed to send`);
          }
          if (succeeded.length) {
            this.toast.success(`${succeeded.length} agent(s) sent successfully`);
          }

          this.loadPrograms();
        },
        error: () => {
          this.toast.error('Failed to send agents');
        },
      });
  }
}

