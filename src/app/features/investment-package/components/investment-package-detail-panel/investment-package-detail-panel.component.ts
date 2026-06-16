import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {InvestmentPackage, InvestmentRecord} from '../../models/investment-package.model';
import {TabItem} from '../../../../shared/tabs/models/tab-item.model';
import {TabsComponent} from '../../../../shared/tabs/app-tabs/app-tabs.component';
import {InvestmentPackageViewComponent} from '../investment-package-view/investment-package-view.component';
import {FarmPlotViewComponent} from '../../../farm-plots/components/farm-plot-view/farm-plot-view.component';
import {FarmFollowupsModule} from '../../../farm-followups/farm-followups.module';
import {UserViewComponent} from '../../../users/components/user-view/user-view.component';
import {AuthService} from '../../../auth/services/auth.service';
import {UserService} from '../../../users/services/user.service';
import {InvestmentPackageService} from '../../services/investment-package.service';
import {ToastService} from '../../../../shared/toast/toast.service';
import {User} from '../../../users/models/user.model';

@Component({
  selector: 'app-investment-package-detail-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TabsComponent,
    InvestmentPackageViewComponent,
    FarmPlotViewComponent,
    FarmFollowupsModule,
    UserViewComponent,
  ],
  templateUrl: './investment-package-detail-panel.component.html',
})
export class InvestmentPackageDetailPanelComponent implements OnChanges {
  @Input() investmentPackage: InvestmentPackage | null = null;
  @Input() refreshKey = 0;
  @Input() tabs: TabItem[] = [];
  @Input() packageInvestments: InvestmentRecord[] = [];
  @Input() packageInvestmentsLoading = false;

  @Output() tabChange = new EventEmitter<string>();
  @Output() extensionWorkerAssigned = new EventEmitter<InvestmentPackage>();

  activeTab = '';
  extensionWorkers: User[] = [];
  selectedExtensionWorkerId: string | null = null;
  loadingExtensionWorkers = false;
  assigningExtensionWorker = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private investmentPackageService: InvestmentPackageService,
    private toastService: ToastService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tabs'] || changes['investmentPackage']) {
      this.ensureActiveTab();
    }
    if (changes['investmentPackage']) {
      this.selectedExtensionWorkerId = null;
    }
  }

  get canAssignExtensionWorker(): boolean {
    if (!this.investmentPackage) {
      return false;
    }
    return (
      this.authService.isAdmin() &&
      this.investmentPackage.fundingStatus === 'OPEN' &&
      !this.investmentPackage.extensionWorker
    );
  }

  hasTab(key: string): boolean {
    return this.tabs.some((tab) => tab.key === key);
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
    this.tabChange.emit(tab);
    if (tab === 'extension-worker' && this.extensionWorkers.length === 0 && !this.loadingExtensionWorkers) {
      this.loadExtensionWorkers();
    }
  }

  assignExtensionWorker(): void {
    if (!this.investmentPackage?.id || !this.selectedExtensionWorkerId) {
      return;
    }

    this.assigningExtensionWorker = true;
    this.investmentPackageService.assignExtensionWorker({
      externalId: this.investmentPackage.id,
      extensionWorkerId: this.selectedExtensionWorkerId,
    }).subscribe({
      next: (res) => {
        this.assigningExtensionWorker = false;
        const updated = res?.data ?? null;
        this.selectedExtensionWorkerId = null;
        if (updated) {
          this.extensionWorkerAssigned.emit(updated);
        }
        this.toastService.success('Extension Worker assigned successfully');
      },
      error: () => {
        this.assigningExtensionWorker = false;
        this.toastService.error('Failed to assign Extension Worker');
      },
    });
  }

  formatWorkerName(worker: User | null | undefined): string {
    if (!worker) {
      return '-';
    }
    const name = [worker.firstName, worker.lastName].filter(Boolean).join(' ').trim();
    return name || worker.username || worker.email || '-';
  }

  getExtensionWorkerDisplayName(user: User): string {
    return this.formatWorkerName(user);
  }

  formatAmount(value: number | undefined): string {
    if (value === undefined || value === null) return '-';
    return new Intl.NumberFormat(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(value);
  }

  private ensureActiveTab(): void {
    if (this.tabs.length === 0) {
      this.activeTab = '';
      return;
    }
    if (!this.tabs.some((tab) => tab.key === this.activeTab)) {
      this.activeTab = this.tabs[0].key;
    }
  }

  private loadExtensionWorkers(): void {
    this.loadingExtensionWorkers = true;
    this.userService.getUsersByRole('EXTENSION_WORKER').subscribe({
      next: (users) => {
        this.extensionWorkers = users ?? [];
        this.loadingExtensionWorkers = false;
      },
      error: () => {
        this.extensionWorkers = [];
        this.loadingExtensionWorkers = false;
        this.toastService.error('Failed to load extension workers', 'Extension Worker');
      },
    });
  }
}
