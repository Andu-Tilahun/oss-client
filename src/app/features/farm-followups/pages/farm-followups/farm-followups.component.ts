import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {FarmOperationFollowUp, ExtensionFollowUpStatus, LeaseFollowUp} from '../../models/farm-followups.model';
import {FarmFollowUpsService, FollowUpCreateRequest, FollowUpUpdateRequest} from '../../services/farm-followups.service';
import {FarmOperation} from '../../../farm-crowdfunding/models/farm-crowdfunding.model';
import {LeaseAgreement} from '../../../farm-leases/models/farm-lease.model';

@Component({
  selector: 'app-farm-followups',
  standalone: false,
  templateUrl: './farm-followups.component.html',
  styleUrls: ['./farm-followups.component.css'],
})
export class FarmFollowUpsComponent implements OnInit {
  followUpStatuses: ExtensionFollowUpStatus[] = [
    'SUBMITTED',
    'AMEND',
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
    'POSTPONED',
  ];

  loading = false;

  assignedFarmOperations: FarmOperation[] = [];
  farmFollowUps: FarmOperationFollowUp[] = [];

  assignedLeases: LeaseAgreement[] = [];
  leaseFollowUps: LeaseFollowUp[] = [];

  selectedFarmFollowUp: FarmOperationFollowUp | null = null;
  selectedLeaseFollowUp: LeaseFollowUp | null = null;

  farmScheduleForm: FormGroup;
  farmUpdateForm: FormGroup;

  leaseScheduleForm: FormGroup;
  leaseUpdateForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private service: FarmFollowUpsService,
  ) {
    this.farmScheduleForm = this.fb.group({
      operationId: ['', Validators.required],
      scheduledDate: ['', Validators.required],
      notify: [true, Validators.required],
      remark: [''],
    });

    this.farmUpdateForm = this.fb.group({
      status: ['SUBMITTED', Validators.required],
      notify: [true],
      remark: [''],
      followUpRemark: [''],
      issuesEncountered: [''],
    });

    this.leaseScheduleForm = this.fb.group({
      leaseId: ['', Validators.required],
      scheduledDate: ['', Validators.required],
      notify: [true, Validators.required],
      remark: [''],
    });

    this.leaseUpdateForm = this.fb.group({
      status: ['SUBMITTED', Validators.required],
      notify: [true],
      remark: [''],
      followUpRemark: [''],
      issuesEncountered: [''],
    });
  }

  ngOnInit(): void {
    this.loadAll();
  }

  private normalizeLocalDateTime(dt: string): string {
    if (!dt) return dt;
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dt)) return `${dt}:00`;
    return dt;
  }

  loadAll(): void {
    this.loading = true;
    let farmOps$ = this.service.getAssignedFarmOperations();
    let farms$ = this.service.getFarmOperationFollowUps();
    let leases$ = this.service.getAssignedLeases();
    let leaseFollowUps$ = this.service.getLeaseFollowUps();

    // Simple sequential loads to keep template changes smaller
    farmOps$.subscribe({
      next: (ops) => this.assignedFarmOperations = ops,
      error: () => {},
    });
    farms$.subscribe({
      next: (items) => {
        this.farmFollowUps = items;
      },
      error: () => {},
    });
    leases$.subscribe({
      next: (ls) => this.assignedLeases = ls,
      error: () => {},
    });
    leaseFollowUps$.subscribe({
      next: (items) => {
        this.leaseFollowUps = items;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  // ---- Farm schedule ----
  submitFarmSchedule(): void {
    if (this.farmScheduleForm.invalid) return;
    const v = this.farmScheduleForm.value;

    const payload: FollowUpCreateRequest = {
      scheduledDate: this.normalizeLocalDateTime(v.scheduledDate),
      notify: v.notify,
      remark: v.remark,
      status: 'SUBMITTED',
    };

    this.service.createFarmOperationFollowUp(v.operationId, payload).subscribe({
      next: () => {
        this.selectedFarmFollowUp = null;
        this.farmScheduleForm.reset({notify: true});
        this.loadAll();
      },
    });
  }

  selectFarmFollowUp(item: FarmOperationFollowUp): void {
    this.selectedFarmFollowUp = item;
    this.farmUpdateForm.patchValue({
      status: item.status,
      notify: item.notify,
      remark: item.remark ?? '',
      followUpRemark: item.followUpRemark ?? '',
      issuesEncountered: item.issuesEncountered ?? '',
    });
  }

  updateFarmFollowUp(): void {
    if (!this.selectedFarmFollowUp) return;
    const v = this.farmUpdateForm.value;
    const payload: FollowUpUpdateRequest = {
      status: v.status,
      notify: v.notify,
      remark: v.remark,
      followUpRemark: v.followUpRemark,
      issuesEncountered: v.issuesEncountered,
    };

    this.service.updateFarmOperationFollowUp(this.selectedFarmFollowUp.id, payload).subscribe({
      next: () => {
        this.selectedFarmFollowUp = null;
        this.loadAll();
      },
    });
  }

  // ---- Lease schedule ----
  submitLeaseSchedule(): void {
    if (this.leaseScheduleForm.invalid) return;
    const v = this.leaseScheduleForm.value;

    const payload = {
      scheduledDate: this.normalizeLocalDateTime(v.scheduledDate),
      notify: v.notify,
      remark: v.remark,
      status: 'SUBMITTED',
    } as FollowUpCreateRequest;

    this.service.createLeaseFollowUp(v.leaseId, payload).subscribe({
      next: () => {
        this.selectedLeaseFollowUp = null;
        this.leaseScheduleForm.reset({notify: true});
        this.loadAll();
      },
    });
  }

  selectLeaseFollowUp(item: LeaseFollowUp): void {
    this.selectedLeaseFollowUp = item;
    this.leaseUpdateForm.patchValue({
      status: item.status,
      notify: item.notify,
      remark: item.remark ?? '',
      followUpRemark: item.followUpRemark ?? '',
      issuesEncountered: item.issuesEncountered ?? '',
    });
  }

  updateLeaseFollowUp(): void {
    if (!this.selectedLeaseFollowUp) return;
    const v = this.leaseUpdateForm.value;
    const payload: FollowUpUpdateRequest = {
      status: v.status,
      notify: v.notify,
      remark: v.remark,
      followUpRemark: v.followUpRemark,
      issuesEncountered: v.issuesEncountered,
    };

    this.service.updateLeaseFollowUp(this.selectedLeaseFollowUp.id, payload).subscribe({
      next: () => {
        this.selectedLeaseFollowUp = null;
        this.loadAll();
      },
    });
  }
}

