import {Component, OnInit} from '@angular/core';
import {ExtensionFollowUpStatus, FarmlandRestorationPlan, RestorationPlanStatus} from '../../models/farm-followups.model';
import {LeaseAgreement} from '../../../farm-leases/models/farm-lease.model';
import {AuthService} from '../../../auth/services/auth.service';
import {UserService} from '../../../users/services/user.service';
import {User} from '../../../users/models/user.model';
import {FarmPlotService} from '../../../farm-plots/services/farm-plot.service';
import {FarmPlot} from '../../../farm-plots/models/farm-plot.model';
import {FarmFollowUpsService, FollowUpCreateRequest} from '../../services/farm-followups.service';
import {ToastService} from '../../../../shared/toast/toast.service';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';
import {CrowdFunding} from "../../../crowd-funding/models/crowd-funding.model";

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

  assignedFarmOperations: CrowdFunding[] = [];
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
  searchText = '';
  statusFilter: RestorationPlanStatus | '' = '';
  pageSize = 10;
  pageIndex = 1;

  adminColumns: DataTableColumn<FarmlandRestorationPlan>[] = [
    {header: 'Farm Plot', value: (p) => p.farmPlotId || '-'},
    {header: 'Start', value: (p) => p.startDate || '-'},
    {header: 'End', value: (p) => p.endDate || '-'},
    {header: 'Assigned To', value: (p) => p.assignedTo || '-'},
    {header: 'Status', value: (p) => p.status || '-'},
  ];

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
          this.selectedAdminPlan = items.length ? {...items[0]} : null;
          this.pageIndex = 1;
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

  get filteredAdminPlans(): FarmlandRestorationPlan[] {
    let items = this.restorationPlansForAdmin;
    const search = this.searchText.trim().toLowerCase();

    if (search) {
      items = items.filter((item) => {
        const haystack = [
          item.id,
          item.farmPlotId,
          item.assignedTo,
          item.status,
          item.startDate,
          item.endDate,
        ].join(' ').toLowerCase();
        return haystack.includes(search);
      });
    }

    if (this.statusFilter) {
      items = items.filter((item) => item.status === this.statusFilter);
    }

    return items;
  }

  get pagedAdminPlans(): FarmlandRestorationPlan[] {
    const start = (this.pageIndex - 1) * this.pageSize;
    return this.filteredAdminPlans.slice(start, start + this.pageSize);
  }

  get selectedAdminPlanStatusPillClass(): string {
    return this.statusPillClass(this.selectedAdminPlan?.status);
  }

  onAdminPageChange(params: TableQueryParams): void {
    this.pageIndex = params.pageIndex;
    this.pageSize = params.pageSize;
  }

  onAdminFilterSearch(): void {
    this.pageIndex = 1;
  }

  onAdminClearFilters(): void {
    this.searchText = '';
    this.statusFilter = '';
    this.pageIndex = 1;
  }

  onAdminStatusChange(value: string): void {
    this.statusFilter = value as RestorationPlanStatus | '';
    this.pageIndex = 1;
  }

  onAdminView(plan: FarmlandRestorationPlan): void {
    this.selectedAdminPlan = {...plan};
  }

  statusPillClass(status?: RestorationPlanStatus): string {
    switch ((status || '').toUpperCase()) {
      case 'ACTIVE':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'RESTORATION_END':
        return 'border-sky-200 bg-sky-50 text-sky-700';
      case 'CANCELLED':
        return 'border-rose-200 bg-rose-50 text-rose-700';
      case 'SUBMITTED':
      default:
        return 'border-amber-200 bg-amber-50 text-amber-700';
    }
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

