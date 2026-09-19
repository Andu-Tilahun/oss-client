import {Component, OnInit} from '@angular/core';
import {forkJoin} from 'rxjs';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {FarmPlot, FarmPlotFilterRequest} from '../../../farm-plots/models/farm-plot.model';
import {FarmPlotService} from '../../../farm-plots/services/farm-plot.service';
import {RestorationPlan} from '../../models/restoration-plan.model';
import {RestorationPlanService} from '../../services/restoration-plan.service';
import {AuthService} from '../../../auth/services/auth.service';
import {UserService} from '../../../users/services/user.service';
import {User} from '../../../users/models/user.model';

@Component({
  selector: 'app-farm-followups-page',
  standalone: false,
  templateUrl: './farm-followups-page.component.html',
  styleUrl: './farm-followups-page.component.css',
})
export class FarmFollowupsPageComponent implements OnInit {
  plots: FarmPlot[] = [];
  loading = false;
  selectedPlot: FarmPlot | null = null;

  plans: RestorationPlan[] = [];

  workers: User[] = [];

  showAssignModal = false;

  columns: DataTableColumn<FarmPlot>[] = [
    {header: 'Title', value: (p) => p.title},
  ];

  constructor(
    private farmPlotService: FarmPlotService,
    private restorationPlanService: RestorationPlanService,
    private userService: UserService,
    private authService: AuthService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadInitial();
    if (this.isAdmin) {
      this.loadWorkers();
    }
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  get isExtensionWorker(): boolean {
    return this.authService.isExtensionWorker();
  }

  get currentUserId(): string | null {
    return this.authService.getCurrentUser()?.id ?? null;
  }

  get currentUser(): User | null {
    return this.authService.getCurrentUser();
  }

  get selectedPlan(): RestorationPlan | null {
    if (!this.selectedPlot) return null;
    return this.plans.find((p) => p.farmPlotId === this.selectedPlot!.id) ?? null;
  }

  get visiblePlots(): FarmPlot[] {
    if (this.isAdmin) return this.plots;
    const assignedPlotIds = new Set(this.plans.map((p) => p.farmPlotId));
    return this.plots.filter((p) => assignedPlotIds.has(p.id));
  }

  selectPlot(plot: FarmPlot): void {
    this.selectedPlot = plot;
  }

  onAssignRequested(): void {
    this.showAssignModal = true;
  }

  onPlanChanged(): void {
    this.showAssignModal = false;
    this.loadPlans();
  }

  private loadInitial(): void {
    this.loading = true;
    const request: FarmPlotFilterRequest = {
      sortBy: 'title',
      sortDirection: 'ASC',
      page: 0,
      size: 200,
    };
    const plans$ = this.isAdmin
      ? this.restorationPlanService.listAllForAdmin()
      : this.restorationPlanService.listForWorker();

    forkJoin({
      plots: this.farmPlotService.filterRepairFarmPlots(request),
      plans: plans$,
    }).subscribe({
      next: ({plots, plans}) => {
        this.plots = plots.content ?? [];
        this.plans = plans ?? [];
        this.loading = false;
        if (!this.selectedPlot && this.visiblePlots.length > 0) {
          this.selectedPlot = this.visiblePlots[0];
        }
      },
      error: (error) => {
        this.plots = [];
        this.plans = [];
        this.loading = false;
        this.toastService.error(error.message || 'Failed to retrieve farm plots', 'Farm Plots');
      },
    });
  }

  private loadPlans(): void {
    const call$ = this.isAdmin
      ? this.restorationPlanService.listAllForAdmin()
      : this.restorationPlanService.listForWorker();
    call$.subscribe({
      next: (plans) => {
        this.plans = plans ?? [];
      },
      error: () => {
        this.plans = [];
      },
    });
  }

  private loadWorkers(): void {
    this.userService.getUsersByRole('EXTENSION_WORKER').subscribe({
      next: (users) => {
        this.workers = users;
      },
      error: () => {
        this.workers = [];
      },
    });
  }
}
