import {Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FarmPlot} from '../../../farm-plots/models/farm-plot.model';
import {FarmPlotService} from '../../../farm-plots/services/farm-plot.service';
import {AuthService} from '../../../auth/services/auth.service';
import {InvestmentPackageTypeAgreement} from '../../models/investment-package-type.model';
import {InvestmentPackageTypeService} from '../../services/investment-package-type.service';
import {
  InvestmentPackage,
  InvestmentPackageType,
  InvestmentRecord,
} from '../../../investment-package/models/investment-package.model';
import {InvestmentPackageService} from '../../../investment-package/services/investment-package.service';
import {TabItem} from '../../../../shared/tabs/models/tab-item.model';
import {ToastService} from '../../../../shared/toast/toast.service';

export type InvestmentPackageTypeDetailMode = 'plot' | 'lease';

@Component({
  selector: 'app-investment-package-type-plot-detail',
  standalone: false,
  templateUrl: './investment-package-type-plot-detail.component.html',
})
export class InvestmentPackageTypePlotDetailComponent implements OnInit, OnChanges {
  @Input() mode: InvestmentPackageTypeDetailMode = 'plot';
  @Input() embedded = false;

  @Input() plot: FarmPlot | null = null;
  @Input() showCreateLeaseButton = false;

  @Input() agreement: InvestmentPackageTypeAgreement | null = null;
  @Input() investmentPackageType: InvestmentPackageType = 'LEASING';
  @Input() refreshKey = 0;
  @Input() tabs: TabItem[] = [];
  @Input() forcedTab: string | null = null;
  @Input() packageInvestments: InvestmentRecord[] = [];
  @Input() packageInvestmentsLoading = false;
  @Input() biddingLeaderboard: InvestmentRecord[] = [];

  @Output() createLease = new EventEmitter<void>();
  @Output() tabChange = new EventEmitter<string>();
  @Output() extensionWorkerAssigned = new EventEmitter<InvestmentPackage>();
  @Output() candidatesChosen = new EventEmitter<void>();
  @Output() agreementCreated = new EventEmitter<void>();
  @Output() investClicked = new EventEmitter<void>();
  @Output() agreementStatusChanged = new EventEmitter<string | null>();
  @Output() completed = new EventEmitter<void>();

  readonly routeId: string = this.route.snapshot.paramMap.get('id') ?? '';

  showCreatePackageTypeCta = false;
  showCreateModal = false;
  farmPlot: FarmPlot | null = null;

  loading = false;
  error = '';

  pageTitle = 'Leasing Investment Packages';
  internalRefreshKey = 0;
  internalPackageInvestments: InvestmentRecord[] = [];
  internalPackageInvestmentsLoading = false;

  private readonly defaultTabs: TabItem[] = [
    {key: 'detail', label: 'Detail'},
    {key: 'farm-plot', label: 'FarmPlot'},
    {key: 'investor', label: 'Investor'},
    {key: 'extension-worker', label: 'Extension Worker'},
    {key: 'follow-up', label: 'FollowUp'},
  ];

  constructor(
    private route: ActivatedRoute,
    private farmPlotService: FarmPlotService,
    private authService: AuthService,
    private router: Router,
    private investmentPackageTypeService: InvestmentPackageTypeService,
    private investmentPackageService: InvestmentPackageService,
    private toastService: ToastService,
  ) {}

  get isInvestor(): boolean {
    return this.authService.isInvestor();
  }

  get routeSegment(): string {
    return this.investmentPackageType.toLowerCase();
  }

  get listRoute(): string {
    return `/investment-package-types/${this.routeSegment}`;
  }

  get plotId(): string {
    return this.plot?.id ?? this.routeId;
  }

  get pageHeading(): string {
    if (this.mode === 'lease') {
      return this.pageTitle;
    }
    return 'Farm Plot Detail';
  }

  get effectiveTabs(): TabItem[] {
    return this.tabs.length > 0 ? this.tabs : this.defaultTabs;
  }

  get effectiveRefreshKey(): number {
    return this.embedded ? this.refreshKey : this.internalRefreshKey;
  }

  get effectivePackageInvestments(): InvestmentRecord[] {
    return this.embedded ? this.packageInvestments : this.internalPackageInvestments;
  }

  get effectivePackageInvestmentsLoading(): boolean {
    return this.embedded ? this.packageInvestmentsLoading : this.internalPackageInvestmentsLoading;
  }

  get effectiveAgreement(): InvestmentPackageTypeAgreement | null {
    return this.agreement;
  }

  get showPlotCreateLeaseButton(): boolean {
    if (this.embedded) {
      return this.showCreateLeaseButton;
    }
    return this.showCreatePackageTypeCta;
  }

  ngOnInit(): void {
    if (!this.embedded) {
      this.syncRouteContext();
    }

    this.initializeForMode();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] && !changes['mode'].firstChange) {
      this.initializeForMode();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.mode === 'plot') {
      this.refreshCreatePackageTypeCta();
    }
  }

  private syncRouteContext(): void {
    const data = this.route.snapshot.data;
    this.investmentPackageType = data['investmentPackageType'] ?? this.investmentPackageType;
    this.pageTitle = data['pageTitle'] ?? this.pageTitle;

    const routeMode = data['detailMode'] as InvestmentPackageTypeDetailMode | undefined;
    if (routeMode) {
      this.mode = routeMode;
    }
  }

  private initializeForMode(): void {
    if (this.mode === 'plot') {
      this.refreshCreatePackageTypeCta();
      return;
    }

    if (this.embedded || this.agreement) {
      return;
    }

    if (!this.routeId) {
      this.error = 'Package type not found.';
      return;
    }

    this.loading = true;
    this.investmentPackageTypeService.getById(this.routeId).subscribe({
      next: (res) => {
        this.agreement = (res as unknown as InvestmentPackageTypeAgreement) ?? null;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load package type detail.';
        this.loading = false;
      },
    });
  }

  private refreshCreatePackageTypeCta(): void {
    this.showCreatePackageTypeCta = this.isInvestor && window.innerWidth < 1020;
  }

  openCreatePackageTypeFromPlot(): void {
    if (this.embedded) {
      this.createLease.emit();
      return;
    }

    if (this.farmPlot) {
      this.showCreateModal = true;
      return;
    }

    const id = this.plotId;
    if (!id) {
      return;
    }

    this.farmPlotService.getFarmPlotById(id).subscribe({
      next: (p) => {
        this.farmPlot = p;
        this.showCreateModal = true;
      },
    });
  }

  onPackageTypeCreated(): void {
    this.showCreateModal = false;
    void this.router.navigate([this.listRoute]);
  }

  asInvestmentPackage(lease: InvestmentPackageTypeAgreement | null): InvestmentPackage | null {
    if (!lease) {
      return null;
    }
    return {
      ...lease,
      farmPlotId: lease.farmPlotId ?? lease.farmPlot?.id ?? '',
      followUpDtoList: lease.followUpDtoList ?? [],
    } as InvestmentPackage;
  }

  onTabChange(tab: string): void {
    if (this.embedded) {
      this.tabChange.emit(tab);
      return;
    }

    if (tab === 'investor' && this.agreement?.id) {
      this.loadPackageInvestments(this.agreement.id);
    }
  }

  onExtensionWorkerAssigned(pkg: InvestmentPackage): void {
    if (this.embedded) {
      this.extensionWorkerAssigned.emit(pkg);
      return;
    }

    this.agreement = pkg as InvestmentPackageTypeAgreement;
    this.internalRefreshKey++;
  }

  onCandidatesChosen(): void {
    if (this.embedded) {
      this.candidatesChosen.emit();
      return;
    }

    this.internalRefreshKey++;
  }

  onAgreementCreated(): void {
    if (this.embedded) {
      this.agreementCreated.emit();
      return;
    }

    this.internalRefreshKey++;
  }

  onInvestClicked(): void {
    this.investClicked.emit();
  }

  onCompleted(): void {
    if (this.embedded) {
      this.completed.emit();
      return;
    }

    this.internalRefreshKey++;
    if (this.effectiveAgreement?.id) {
      this.loadPackageInvestments(this.effectiveAgreement.id);
    }
  }

  onAgreementStatusChanged(status: string | null): void {
    if (this.embedded) {
      this.agreementStatusChanged.emit(status);
    }
  }

  private loadPackageInvestments(packageId: string): void {
    this.internalPackageInvestmentsLoading = true;
    this.investmentPackageService.filterInvestments({
      investmentPackageIds: [packageId],
      sortBy: 'createdDate',
      sortDirection: 'DESC',
      page: 0,
      size: 100,
    }).subscribe({
      next: (response) => {
        this.internalPackageInvestments = (response.content ?? []).filter(
          (investment) => investment.investmentPackageId === packageId,
        );
        this.internalPackageInvestmentsLoading = false;
      },
      error: (error) => {
        this.internalPackageInvestments = [];
        this.internalPackageInvestmentsLoading = false;
        this.toastService.error(
          error.message || 'Failed to load package investors',
          'Load Investors',
        );
      },
    });
  }
}
