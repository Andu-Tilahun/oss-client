import {Component, OnInit} from '@angular/core';
import {ExtensionFollowUpStatus, FarmlandRestorationPlan, RestorationPlanStatus} from '../../models/farm-followups.model';
import {FarmOperation} from '../../../farm-crowdfunding/models/farm-crowdfunding.model';
import {LeaseAgreement} from '../../../farm-leases/models/farm-lease.model';
import {AuthService} from '../../../auth/services/auth.service';
import {UserService} from '../../../users/services/user.service';
import {User} from '../../../users/models/user.model';
import {FarmPlotService} from '../../../farm-plots/services/farm-plot.service';
import {FarmPlot} from '../../../farm-plots/models/farm-plot.model';
import {FarmFollowUpsService, FollowUpCreateRequest} from '../../services/farm-followups.service';
import {ToastService} from '../../../../shared/toast/toast.service';

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
  restorationStatuses: RestorationPlanStatus[] = ['SUBMITTED', 'ACTIVE', 'RESTORATION_END', 'CANCELLED'];

  loading = false;
  isAdmin = false;
  isExtensionWorker = false;

  assignedFarmOperations: FarmOperation[] = [];
  assignedLeases: LeaseAgreement[] = [];
  restorationPlansForAdmin: FarmlandRestorationPlan[] = [];
  restorationPlansForWorker: FarmlandRestorationPlan[] = [];

  farmPlots: FarmPlot[] = [];
  extensionWorkers: User[] = [];

  showCreateRestorationModal = false;
  showEditRestorationModal = false;
  showWorkerUpdateModal = false;
  selectedAdminPlan: FarmlandRestorationPlan | null = null;
  selectedWorkerPlan: FarmlandRestorationPlan | null = null;

  constructor(
    private service: FarmFollowUpsService,
    private authService: AuthService,
    private userService: UserService,
    private farmPlotService: FarmPlotService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.isAdmin = currentUser?.role === 'ADMIN';
    this.isExtensionWorker = currentUser?.role === 'EXTENSION_WORKER';
    this.loadAll();
  }

  loadAll(): void {
    this.loading = true;

    if (this.isExtensionWorker) {
      this.service.getAssignedFarmOperations().subscribe({next: (ops) => this.assignedFarmOperations = ops, error: () => {}});
      this.service.getAssignedLeases().subscribe({next: (ls) => this.assignedLeases = ls, error: () => {}});
      this.service.getAssignedRestorationPlansForWorker().subscribe({
        next: (items) => {
          this.restorationPlansForWorker = items;
          this.loading = false;
        },
        error: () => this.loading = false,
      });
      return;
    }

    if (this.isAdmin) {
      this.userService.getUsersByRole('EXTENSION_WORKER').subscribe({next: (users) => this.extensionWorkers = users, error: () => {}});
      this.farmPlotService.getAllFarmPlots(0, 200).subscribe({next: (page) => this.farmPlots = page.content ?? [], error: () => {}});
      this.service.getRestorationPlansForAdmin().subscribe({
        next: (items) => {
          this.restorationPlansForAdmin = items;
          this.loading = false;
        },
        error: () => this.loading = false,
      });
      return;
    }

    this.loading = false;
  }

  openCreateRestorationModal(): void {
    this.showCreateRestorationModal = true;
  }

  openEditRestorationModal(plan: FarmlandRestorationPlan): void {
    this.selectedAdminPlan = plan;
    this.showEditRestorationModal = true;
  }

  openWorkerUpdateModal(plan: FarmlandRestorationPlan): void {
    this.selectedWorkerPlan = plan;
    this.showWorkerUpdateModal = true;
  }

  onRestorationCreated(): void {
    this.loadAll();
  }

  onRestorationUpdated(): void {
    this.loadAll();
  }

  createQuickFarmOperationSchedule(operationId: string): void {
    const payload: FollowUpCreateRequest = {
      scheduledDate: this.nowLocalDateTimeForApi(),
      notify: true,
      remark: 'Initial follow-up created from follow-up list',
      status: 'SUBMITTED',
    };

    this.service.createFarmOperationFollowUp(operationId, payload).subscribe({
      next: () => this.toastService.success('Farm operation follow-up plan created'),
      error: (error) => this.toastService.error(error.message || 'Failed to create farm operation follow-up'),
    });
  }

  createQuickLeaseSchedule(leaseId: string): void {
    const payload: FollowUpCreateRequest = {
      scheduledDate: this.nowLocalDateTimeForApi(),
      notify: true,
      remark: 'Initial follow-up created from follow-up list',
      status: 'SUBMITTED',
    };

    this.service.createLeaseFollowUp(leaseId, payload).subscribe({
      next: () => this.toastService.success('Lease follow-up plan created'),
      error: (error) => this.toastService.error(error.message || 'Failed to create lease follow-up'),
    });
  }

  private nowLocalDateTimeForApi(): string {
    const now = new Date();
    const pad = (n: number) => `${n}`.padStart(2, '0');
    const value = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
    return value;
  }
}

