import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {forkJoin} from 'rxjs';
import {
  ChooseCandidatesRequest,
  CreateInvestmentAgreementRequest,
  InvestmentAgreement,
  InvestmentPackage,
  InvestmentPackageType,
  InvestmentRecord,
  InvestorAgreeResponseRequest,
} from '../../models/investment-package.model';
import {FundingStatus} from '../../../../shared/models/funding-status.model';
import {Endpoints} from '../../../../core/endpoint/endpoint.model';
import {environment} from '../../../../../environments/environment';
import {TabItem} from '../../../../shared/tabs/models/tab-item.model';
import {TabsComponent} from '../../../../shared/tabs/app-tabs/app-tabs.component';
import {InvestmentPackageViewComponent} from '../investment-package-view/investment-package-view.component';
import {FarmPlotViewComponent} from '../../../farm-plots/components/farm-plot-view/farm-plot-view.component';
import {FarmFollowupsModule} from '../../../farm-followups/farm-followups.module';
import {UserViewComponent} from '../../../users/components/user-view/user-view.component';
import {ImageGalleryModalComponent} from '../../../../shared/modals/image-gallery-modal/image-gallery-modal.component';
import {DocumentUploadComponent} from '../../../../shared/file-upload/document-upload/document-upload.component';
import {AuthService} from '../../../auth/services/auth.service';
import {UserService} from '../../../users/services/user.service';
import {InvestmentPackageService} from '../../services/investment-package.service';
import {ToastService} from '../../../../shared/toast/toast.service';
import {User} from '../../../users/models/user.model';
import {AssignExtensionWorkerRequest, ChangeExtensionWorkerRequest} from '../../../assign-extension-worker-request';

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
    ImageGalleryModalComponent,
    DocumentUploadComponent,
  ],
  templateUrl: './investment-package-detail-panel.component.html',
})
export class InvestmentPackageDetailPanelComponent implements OnChanges {
  @Input() investmentPackage: InvestmentPackage | null = null;
  @Input() investmentPackageType: InvestmentPackageType = 'LEASING';
  @Input() refreshKey = 0;
  @Input() tabs: TabItem[] = [];
  @Input() forcedTab: string | null = null;
  @Input() packageInvestments: InvestmentRecord[] = [];
  @Input() packageInvestmentsLoading = false;
  @Input() biddingLeaderboard: InvestmentRecord[] = [];

  @Output() tabChange = new EventEmitter<string>();
  @Output() extensionWorkerAssigned = new EventEmitter<InvestmentPackage>();
  @Output() candidatesChosen = new EventEmitter<void>();
  @Output() agreementCreated = new EventEmitter<void>();
  @Output() investClicked = new EventEmitter<void>();

  activeTab = '';
  extensionWorkers: User[] = [];
  selectedExtensionWorkerId: string | null = null;
  loadingExtensionWorkers = false;
  assigningExtensionWorker = false;
  showChangeExtensionWorkerForm = false;
  changeExtensionWorkerId: string | null = null;
  changeExtensionWorkerDescription = '';
  changingExtensionWorker = false;
  closedLeaseInvestors: User[] = [];
  closedLeaseInvestorsLoading = false;
  selectedCandidateIds: string[] = [];
  choosingCandidates = false;
  confirmedCandidates: User[] = [];
  candidatesConfirmedView = false;
  showAttachmentModal = false;
  attachmentModalUrls: string[] = [];
  attachmentModalIndex = 0;
  agreement: InvestmentAgreement | null = null;
  agreementLoading = false;
  creatingAgreement = false;
  investorAgreeAttachmentId: string | null = null;
  investorAgreeing = false;
  investorAgreed = false;
  // BIDDING: chosen investor payment receipt
  paymentReceiptAttachmentId: string | null = null;
  submittingPayment = false;
  paymentSubmitted = false;
  private ownBidRecordId: string | null = null;
  private ownBidRecordPackageId: string | null = null;
  private loadedClosedLeaseInvestorsKey: string | null = null;
  private lastPackageIdForCandidates: string | null = null;
  private loadedAgreementId: string | null = null;

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
      // asInvestmentPackage() rebuilds a new object on every CD cycle, so investmentPackage
      // changes by reference far more often than the underlying package actually changes.
      // Only reset transient form state when the package id genuinely differs.
      if (this.investmentPackage?.id !== this.lastPackageIdForCandidates) {
        this.lastPackageIdForCandidates = this.investmentPackage?.id ?? null;
        this.selectedCandidateIds = [];
        this.confirmedCandidates = [];
        this.candidatesConfirmedView = false;
        this.selectedExtensionWorkerId = null;
        this.showChangeExtensionWorkerForm = false;
        this.changeExtensionWorkerId = null;
        this.changeExtensionWorkerDescription = '';
        this.investorAgreeAttachmentId = null;
        this.investorAgreeing = false;
        this.investorAgreed = false;
        this.paymentReceiptAttachmentId = null;
        this.submittingPayment = false;
        this.paymentSubmitted = false;
        this.ownBidRecordId = null;
        this.ownBidRecordPackageId = null;
      }
      if (this.isChosenBidder && this.ownBidRecordPackageId !== this.investmentPackage?.id) {
        this.loadOwnBidRecord();
      }
      if (!this.isInvestorRole && (this.activeTab === 'investor' || this.activeTab === 'choose-candidate')) {
        this.maybeLoadClosedLeaseInvestors();
      }
      if (this.activeTab === 'contract') {
        this.maybeLoadAgreement();
      }
    }
    if (changes['refreshKey'] && this.forcedTab && this.hasTab(this.forcedTab)) {
      this.onTabChange(this.forcedTab);
    }
  }

  get canAssignExtensionWorker(): boolean {
    if (!this.investmentPackage || !this.authService.isAdmin() || this.investmentPackage.extensionWorker) {
      return false;
    }
    if (this.investmentPackage.investmentPackageType === 'LEASING') {
      return !!this.investmentPackage.agreementId && this.investmentPackage.status !== 'SENT';
    }
    return this.investmentPackage.fundingStatus === 'OPEN';
  }

  get canChangeExtensionWorker(): boolean {
    return this.authService.isAdmin() && !!this.investmentPackage?.extensionWorker;
  }

  get canInvestorAgreeOnContract(): boolean {
    return this.isInvestorRole &&
      !!this.ownInvestorProfile &&
      !!this.investmentPackage?.agreementId &&
      this.investmentPackage?.status === 'SENT';
  }

  get selectedExtensionWorkerDetail(): User | null {
    return this.extensionWorkers.find((w) => w.id === this.selectedExtensionWorkerId) ?? null;
  }

  get selectedChangeExtensionWorkerDetail(): User | null {
    return this.extensionWorkers.find((w) => w.id === this.changeExtensionWorkerId) ?? null;
  }

  get isAdminRole(): boolean {
    return this.authService.isAdmin();
  }

  get isInvestorRole(): boolean {
    return this.authService.isInvestor();
  }

  get isExtensionWorkerRole(): boolean {
    return this.authService.isExtensionWorker();
  }

  get isBiddingType(): boolean {
    return this.investmentPackageType === 'BIDDING';
  }

  get investTypeLabel(): string {
    switch (this.investmentPackageType) {
      case 'BIDDING':      return 'Bidding';
      case 'CROWDFUNDING': return 'Crowdfunding';
      default:             return 'Lease';
    }
  }

  get investButtonLabel(): string {
    return this.investmentPackageType === 'BIDDING' ? 'Place a Bid' : 'Invest Now';
  }

  get isChosenBidder(): boolean {
    if (!this.isInvestorRole || !this.isBiddingType || !this.investmentPackage) return false;
    const currentUserId = this.authService.getCurrentUser()?.id;
    if (!currentUserId) return false;
    const ownRecord = this.packageInvestments.find(r => r.investorId === currentUserId);
    return ownRecord?.status === 'PENDING';
  }

  get biddingCandidates(): InvestmentRecord[] {
    const source = this.isInvestorRole ? this.biddingLeaderboard : this.packageInvestments;
    return [...source].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));
  }

  get currentUserId(): string | undefined {
    return this.authService.getCurrentUser()?.id;
  }

  get myBidRank(): number {
    const uid = this.currentUserId;
    if (!uid) return -1;
    const idx = this.biddingCandidates.findIndex(r => r.investorId === uid);
    return idx === -1 ? -1 : idx + 1;
  }

  /** The logged-in investor's own profile on this lease, matched by id against the lease's investor reference. */
  get ownInvestorProfile(): User | null {
    if (!this.isInvestorRole || !this.investmentPackage) {
      return null;
    }
    const currentUserId = this.authService.getCurrentUser()?.id;
    if (!currentUserId || this.investmentPackage.investorId !== currentUserId) {
      return null;
    }
    return this.investmentPackage.investorUser ?? null;
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
    if (!this.isInvestorRole && (tab === 'investor' || tab === 'choose-candidate')) {
      this.maybeLoadClosedLeaseInvestors();
    }
    if (tab === 'contract') {
      this.maybeLoadAgreement();
    }
  }

  get canConfirmCandidates(): boolean {
    if (this.isBiddingType) {
      return this.selectedCandidateIds.length === 1;
    }
    return !!this.investmentPackage?.attachmentIdList?.length && this.investmentPackage?.paymentStatus === 'PENDING';
  }

  get canCreateAgreement(): boolean {
    return !!this.investmentPackage?.attachmentIdList?.length;
  }

  getInvestorAvatarUrl(profileImageUuid: string | null | undefined): string | null {
    return this.getFileUrl(profileImageUuid);
  }

  getFileUrl(fileId: string | null | undefined): string | null {
    return fileId ? `${environment.apiUrl}${Endpoints.STORAGE_ENDPOINT}/${fileId}` : null;
  }

  openAttachmentPreview(attachmentId: string): void {
    const attachmentIds = this.investmentPackage?.attachmentIdList ?? [];
    this.attachmentModalUrls = attachmentIds
      .map((id) => this.getFileUrl(id))
      .filter((url): url is string => !!url);
    this.attachmentModalIndex = Math.max(0, attachmentIds.indexOf(attachmentId));
    this.showAttachmentModal = true;
  }

  assignExtensionWorker(): void {
    const investmentPackageId = this.investmentPackage?.id;
    const farmPlotId = this.investmentPackage?.farmPlotId || this.investmentPackage?.farmPlot?.id;
    const agreementId = this.investmentPackage?.agreementId;
    if (!investmentPackageId || !farmPlotId || !agreementId || !this.selectedExtensionWorkerId) {
      return;
    }

    const request: AssignExtensionWorkerRequest = {
      extensionWorkerId: this.selectedExtensionWorkerId!,
      investmentPackageId,
      agreementId,
      farmPlotId,
    };

    this.assigningExtensionWorker = true;
    this.investmentPackageService.assignExtensionWorker(request).subscribe({
      next: (updated) => {
        this.assigningExtensionWorker = false;
        this.selectedExtensionWorkerId = null;
        if (updated) {
          this.extensionWorkerAssigned.emit(updated);
        }
        this.toastService.success('Extension Worker assigned successfully');
      },
      error: (error) => {
        this.assigningExtensionWorker = false;
        this.toastService.error(error.message || 'Failed to assign Extension Worker');
      },
    });
  }

  toggleChangeExtensionWorkerForm(): void {
    this.showChangeExtensionWorkerForm = !this.showChangeExtensionWorkerForm;
    this.changeExtensionWorkerId = null;
    this.changeExtensionWorkerDescription = '';
    if (this.showChangeExtensionWorkerForm && this.extensionWorkers.length === 0 && !this.loadingExtensionWorkers) {
      this.loadExtensionWorkers();
    }
  }

  changeExtensionWorker(): void {
    const investmentPackageId = this.investmentPackage?.id;
    const agreementId = this.investmentPackage?.agreementId;
    if (!investmentPackageId || !agreementId || !this.changeExtensionWorkerId || this.changingExtensionWorker) {
      return;
    }

    const request: ChangeExtensionWorkerRequest = {
      investmentPackageId,
      agreementId,
      extensionWorkerId: this.changeExtensionWorkerId,
      description: this.changeExtensionWorkerDescription || undefined,
    };

    this.changingExtensionWorker = true;
    this.investmentPackageService.changeExtensionWorker(request).subscribe({
      next: (updated) => {
        this.changingExtensionWorker = false;
        this.showChangeExtensionWorkerForm = false;
        this.changeExtensionWorkerId = null;
        this.changeExtensionWorkerDescription = '';
        if (updated) {
          this.extensionWorkerAssigned.emit(updated);
        }
        this.toastService.success('Extension worker changed successfully');
      },
      error: (error) => {
        this.changingExtensionWorker = false;
        this.toastService.error(error.message || 'Failed to change extension worker');
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

  private getClosedLeaseInvestorIds(): string[] {
    const pkg = this.investmentPackage as (InvestmentPackage & {investorIdList?: string[]}) | null;
    if (!pkg || pkg.fundingStatus !== FundingStatus.CLOSED) {
      return [];
    }
    return pkg.investorIdList ?? [];
  }

  private maybeLoadClosedLeaseInvestors(): void {
    const investorIds = this.getClosedLeaseInvestorIds();
    // asInvestmentPackage() rebuilds a new object on every CD cycle, so investmentPackage
    // changes by reference far more often than the underlying data actually changes.
    // Key on the package id + investor ids so we only re-fetch when they actually differ.
    const key = investorIds.length
      ? `${this.investmentPackage?.id ?? ''}:${investorIds.slice().sort().join(',')}`
      : null;

    if (key === this.loadedClosedLeaseInvestorsKey) {
      return;
    }
    this.loadedClosedLeaseInvestorsKey = key;

    if (!key) {
      this.closedLeaseInvestors = [];
      return;
    }

    this.closedLeaseInvestorsLoading = true;
    forkJoin(investorIds.map((id) => this.userService.getUserById(id))).subscribe({
      next: (users) => {
        this.closedLeaseInvestors = users;
        this.closedLeaseInvestorsLoading = false;
        // Candidates start out all-selected; the admin removes the ones they don't want.
        if (!this.candidatesConfirmedView) {
          this.selectedCandidateIds = users.map((u) => u.id);
        }
      },
      error: () => {
        this.closedLeaseInvestors = [];
        this.closedLeaseInvestorsLoading = false;
        this.toastService.error('Failed to load investor details', 'Investor');
      },
    });
  }

  isCandidateSelected(investorId: string | undefined | null): boolean {
    return !!investorId && this.selectedCandidateIds.includes(investorId);
  }

  toggleCandidate(investorId: string | undefined | null): void {
    if (!investorId) return;
    if (this.isBiddingType) {
      // Single-select for BIDDING
      this.selectedCandidateIds = this.isCandidateSelected(investorId) ? [] : [investorId];
    } else {
      this.selectedCandidateIds = this.isCandidateSelected(investorId)
        ? this.selectedCandidateIds.filter((id) => id !== investorId)
        : [...this.selectedCandidateIds, investorId];
    }
  }

  confirmCandidates(): void {
    const investmentPackageId = this.investmentPackage?.id;
    const farmPlotId = this.investmentPackage?.farmPlotId || this.investmentPackage?.farmPlot?.id;
    if (
      !investmentPackageId ||
      !farmPlotId ||
      this.selectedCandidateIds.length === 0 ||
      this.choosingCandidates ||
      !this.canConfirmCandidates
    ) {
      return;
    }

    const chosenIds = this.selectedCandidateIds;
    const request: ChooseCandidatesRequest = {
      investmentPackageId,
      farmPlotId,
      investorIds: chosenIds,
    };

    this.choosingCandidates = true;
    this.investmentPackageService.chooseCandidates(request).subscribe({
      next: () => {
        this.choosingCandidates = false;
        this.confirmedCandidates = this.closedLeaseInvestors.filter((u) => chosenIds.includes(u.id));
        this.candidatesConfirmedView = true;
        this.toastService.success('Candidates chosen successfully', 'Choose Candidate');
        this.candidatesChosen.emit();
      },
      error: (error) => {
        this.choosingCandidates = false;
        this.toastService.error(error.message || 'Failed to choose candidates', 'Choose Candidate');
      },
    });
  }

  private maybeLoadAgreement(): void {
    const agreementId = this.investmentPackage?.agreementId;
    if (!agreementId) {
      this.agreement = null;
      this.loadedAgreementId = null;
      return;
    }

    if (agreementId === this.loadedAgreementId) {
      return;
    }
    this.loadedAgreementId = agreementId;

    this.agreementLoading = true;
    this.investmentPackageService.getAgreementById(agreementId).subscribe({
      next: (agreement) => {
        this.agreement = agreement ?? null;
        this.agreementLoading = false;
      },
      error: (error) => {
        this.agreement = null;
        this.agreementLoading = false;
        this.toastService.error(error.message || 'Failed to load agreement', 'Contract');
      },
    });
  }

  createAgreement(): void {
    const investmentPackageId = this.investmentPackage?.id;
    const farmPlotId = this.investmentPackage?.farmPlotId || this.investmentPackage?.farmPlot?.id;
    if (!investmentPackageId || !farmPlotId || this.creatingAgreement || !this.canCreateAgreement) {
      return;
    }

    const request: CreateInvestmentAgreementRequest = {
      farmPlotId,
      investmentPackageId,
      paymentStatus: 'PAID',
    };

    this.creatingAgreement = true;
    this.investmentPackageService.createAgreement(request).subscribe({
      next: (agreement) => {
        this.creatingAgreement = false;
        this.agreement = agreement ?? null;
        this.loadedAgreementId = this.agreement?.id ?? null;
        this.toastService.success('Contract created successfully', 'Contract');
        this.agreementCreated.emit();
      },
      error: (error) => {
        this.creatingAgreement = false;
        this.toastService.error(error.message || 'Failed to create contract', 'Contract');
      },
    });
  }

  agreeOnContract(): void {
    const agreementId = this.investmentPackage?.agreementId;
    if (!agreementId || this.investorAgreeing) return;

    this.investorAgreeing = true;
    this.investmentPackageService.activateAgreement(agreementId).subscribe({
      next: (updated) => {
        this.investorAgreeing = false;
        this.investorAgreed = true;
        if (updated) {
          this.agreement = updated;
        }
        this.toastService.success('Contract signed successfully');
        this.agreementCreated.emit();
      },
      error: (err) => {
        this.investorAgreeing = false;
        this.toastService.error(err.message || 'Failed to sign contract');
      },
    });
  }

  private loadOwnBidRecord(): void {
    const packageId = this.investmentPackage?.id;
    if (!packageId) return;
    this.ownBidRecordPackageId = packageId;
    this.investmentPackageService.filterInvestments({
      investmentPackageIds: [packageId],
      page: 0,
      size: 1,
    }).subscribe({
      next: (response) => {
        this.ownBidRecordId = response.content?.[0]?.id ?? null;
      },
      error: () => {
        this.ownBidRecordId = null;
      },
    });
  }

  submitBidPayment(): void {
    const packageId = this.investmentPackage?.id;
    const farmPlotId = this.investmentPackage?.farmPlotId || this.investmentPackage?.farmPlot?.id;
    if (!packageId || !farmPlotId || !this.ownBidRecordId || !this.paymentReceiptAttachmentId || this.submittingPayment) {
      return;
    }

    const request: InvestorAgreeResponseRequest = {
      investmentPackageId: packageId,
      investmentRecordId: this.ownBidRecordId,
      farmPlotId,
      attachmentId: this.paymentReceiptAttachmentId,
    };

    this.submittingPayment = true;
    this.investmentPackageService.investorAgreeResponse(request).subscribe({
      next: () => {
        this.submittingPayment = false;
        this.paymentSubmitted = true;
        this.toastService.success('Payment receipt submitted successfully');
        this.agreementCreated.emit();
      },
      error: (error) => {
        this.submittingPayment = false;
        this.toastService.error(error.message || 'Failed to submit payment receipt', 'Payment Receipt');
      },
    });
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
