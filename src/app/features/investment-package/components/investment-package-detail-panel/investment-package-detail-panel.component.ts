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
  InvestmentStatus,
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
import {FilePreviewModalComponent} from '../../../../shared/modals/file-preview-modal/file-preview-modal.component';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {DocumentUploadComponent} from '../../../../shared/file-upload/document-upload/document-upload.component';
import {
  InvestmentPackageChooseWinnerModalComponent
} from '../../modals/investment-package-choose-winner-modal/investment-package-choose-winner-modal.component';
import {
  InvestmentPackageTypeCompleteModalComponent
} from '../../../investment-package-types/modals/investment-package-type-complete-modal/investment-package-type-complete-modal.component';
import {
  InvestmentPackageDeactivateModalComponent
} from '../../../investment-package-types/modals/investment-package-deactivate-modal/investment-package-deactivate-modal.component';
import {AuthService} from '../../../auth/services/auth.service';
import {UserService} from '../../../users/services/user.service';
import {InvestmentPackageService} from '../../services/investment-package.service';
import {ToastService} from '../../../../shared/toast/toast.service';
import {FileMetadata, FileUploadService} from '../../../../shared/file-upload/file-upload.service';
import {User} from '../../../users/models/user.model';
import {AssignExtensionWorkerRequest, ChangeExtensionWorkerRequest} from '../../../assign-extension-worker-request';
import {NgxEchartsDirective} from 'ngx-echarts';
import type {EChartsOption} from 'echarts';
import {SystemConfigService} from '../../../system-config/services/system-config.service';
import {BankAccount} from '../../../system-config/models/bank-account.model';

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
    FilePreviewModalComponent,
    ModalComponent,
    DocumentUploadComponent,
    InvestmentPackageChooseWinnerModalComponent,
    InvestmentPackageTypeCompleteModalComponent,
    InvestmentPackageDeactivateModalComponent,
    NgxEchartsDirective,
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

  /**
   * Whether this panel is nested inside a split-layout panel whose right column already gets a
   * `lg:bg-white` background (the common case), vs. rendered as a standalone full page with no
   * white ancestor. Controls whether the tabs' sticky header gets its own opaque background — see
   * `app-tabs`'s `stickyBgClass`. Defaults to true since that's how this panel is used everywhere
   * except the standalone `.../package/:id` route.
   */
  @Input() embedded = true;

  @Output() tabChange = new EventEmitter<string>();
  @Output() extensionWorkerAssigned = new EventEmitter<InvestmentPackage>();
  @Output() candidatesChosen = new EventEmitter<void>();
  @Output() agreementCreated = new EventEmitter<void>();
  @Output() investClicked = new EventEmitter<void>();
  @Output() agreementStatusChanged = new EventEmitter<string | null>();
  @Output() completed = new EventEmitter<void>();

  activeTab = '';
  extensionWorkers: User[] = [];
  selectedExtensionWorkerId: string | null = null;
  loadingExtensionWorkers = false;
  assigningExtensionWorker = false;
  showAssignExtensionWorkerModal = false;
  showChangeExtensionWorkerForm = false;
  changeExtensionWorkerId: string | null = null;
  changeExtensionWorkerDescription = '';
  changingExtensionWorker = false;
  closedLeaseInvestors: User[] = [];
  closedLeaseInvestorsLoading = false;
  selectedCandidateIds: string[] = [];
  choosingCandidates = false;
  showChooseWinnerModal = false;
  chooseWinnerRemark = '';
  showCompleteModal = false;
  completing = false;
  completionRemark = '';
  showDeactivateModal = false;
  deactivating = false;
  deactivationReason = '';
  showAttachmentModal = false;
  attachmentModalUrls: string[] = [];
  attachmentModalIndex = 0;
  showFilePreviewModal = false;
  filePreviewUrl: string | null = null;
  approvingInvestorId: string | null = null;
  attachmentMetadata: Partial<Record<string, FileMetadata>> = {};
  private _agreement: InvestmentAgreement | null = null;
  agreementLoading = false;
  creatingAgreement = false;
  investorAgreeAttachmentId: string | null = null;
  investorAgreeing = false;
  investorAgreed = false;
  rejectingInvestorId: string | null = null;
  rejectionReasonInput = '';
  // BIDDING: chosen investor payment receipt
  paymentReceiptAttachmentId: string | null = null;
  submittingPayment = false;
  paymentSubmitted = false;
  // CROWDFUNDING: chosen investor payment receipt
  crowdfundingPaymentReceiptAttachmentId: string | null = null;
  submittingCrowdfundingPayment = false;
  crowdfundingPaymentSubmitted = false;
  private ownBidRecordId: string | null = null;
  private ownBidRecordPackageId: string | null = null;
  private loadedClosedLeaseInvestorsKey: string | null = null;
  private lastPackageIdForCandidates: string | null = null;
  private loadedAgreementId: string | null = null;
  bankAccounts: BankAccount[] = [];
  private bankAccountsLoaded = false;

  crowdfundingShareChartOption: EChartsOption = {};

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private investmentPackageService: InvestmentPackageService,
    private toastService: ToastService,
    private fileUploadService: FileUploadService,
    private systemConfigService: SystemConfigService,
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
        this.showChooseWinnerModal = false;
        this.chooseWinnerRemark = '';
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
        this.crowdfundingPaymentReceiptAttachmentId = null;
        this.submittingCrowdfundingPayment = false;
        this.crowdfundingPaymentSubmitted = false;
      }
      this.maybeLoadOwnBidRecord();
      if (!this.isInvestorRole && this.activeTab === 'investor') {
        this.maybeLoadClosedLeaseInvestors();
      }
      this.maybeLoadAgreement();
      this.maybeLoadAttachmentMetadata();
      this.maybeLoadBankAccounts();
    }
    if (changes['packageInvestments']) {
      this.maybeLoadInvestorRecordAttachmentMetadata();
      // isChosenBidder depends on packageInvestments, which loads separately from (and often
      // after) investmentPackage — re-check here too, or a chosen bidder whose investor record
      // arrives late would never get their ownBidRecordId populated.
      this.maybeLoadOwnBidRecord();
    }
    if (changes['refreshKey'] && this.forcedTab && this.hasTab(this.forcedTab)) {
      this.onTabChange(this.forcedTab);
    }
    if (changes['biddingLeaderboard']) {
      this.crowdfundingShareChartOption = {
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { orient: 'horizontal', bottom: 0 },
        series: [{
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '45%'],
          label: { show: false },
          emphasis: { label: { show: true, fontWeight: 'bold' } },
          data: this.biddingLeaderboard
            .filter(r => r.status !== 'CANCELED' && r.status !== 'FAILED' && r.status !== 'REJECTED')
            .map(r => ({
              name: this.formatWorkerName(r.investorUser),
              value: r.amount,
            })),
        }],
      };
    }
  }

  get agreement(): InvestmentAgreement | null {
    return this._agreement;
  }

  set agreement(value: InvestmentAgreement | null) {
    this._agreement = value;
    this.agreementStatusChanged.emit(value?.status ?? null);
  }

  get canAssignExtensionWorker(): boolean {
    if (!this.investmentPackage || !this.authService.isAdmin() || this.investmentPackage.extensionWorker) {
      return false;
    }
    return !!this.investmentPackage.agreementId && this.agreement?.status === 'ACTIVE';
  }

  get canChangeExtensionWorker(): boolean {
    return this.authService.isAdmin()
      && !!this.investmentPackage?.extensionWorker
      && this.investmentPackage?.packageStatus !== 'COMPLITED'
      && !(this.investmentPackage?.fundingStatus === FundingStatus.FAILED
        && this.investmentPackage?.packageStatus === 'INACTIVE');
  }

  get canInvestorAgreeOnContract(): boolean {
    if (this.isCrowdfundingType) {
      return this.isInvestorRole &&
        this.agreement?.status === 'SENT' &&
        this.ownInvestmentRecord?.status === 'ACCEPTED' &&
        !this.currentInvestorHasSigned;
    }
    const base = this.isInvestorRole &&
      !!this.investmentPackage?.agreementId &&
      this.agreement?.status === 'SENT';
    return base && !!this.ownInvestorProfile;
  }

  get currentInvestorHasSigned(): boolean {
    return !!this.ownInvestmentRecord?.signedAt;
  }

  /** Accepted co-investors on this crowdfunding package — the actual set that must sign,
   * as opposed to investmentPackage.investorIdList which includes every past applicant. */
  get crowdfundingSigningRecords(): InvestmentRecord[] {
    return this.packageInvestments.filter(r => r.status === 'ACCEPTED' || (r.status === 'ACTIVE' && !!r.signedAt));
  }

  get allCrowdfundingInvestorsSigned(): boolean {
    const recs = this.crowdfundingSigningRecords;
    return recs.length > 0 && recs.every(r => !!r.signedAt);
  }

  get crowdfundingPendingSignatureCount(): number {
    return this.crowdfundingSigningRecords.filter(r => !r.signedAt).length;
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

  get isFollowUpReadOnly(): boolean {
    return this.isExtensionWorkerRole &&
      (this.investmentPackage?.packageStatus === 'INACTIVE' || this.investmentPackage?.packageStatus === 'COMPLITED');
  }

  get isBiddingType(): boolean {
    return this.investmentPackageType === 'BIDDING';
  }

  get isCrowdfundingType(): boolean {
    return this.investmentPackageType === 'CROWDFUNDING';
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
    return ownRecord?.status === 'PENDING'
      || ownRecord?.status === 'PAID'
      || ownRecord?.status === 'REJECTED'
      || ownRecord?.status === 'ACCEPTED';
  }

  get isChosenCrowdfundingInvestor(): boolean {
    if (!this.isInvestorRole || !this.isCrowdfundingType || !this.investmentPackage) return false;
    const uid = this.authService.getCurrentUser()?.id;
    if (!uid) return false;
    const status = this.packageInvestments.find(r => r.investorId === uid)?.status;
    return status === 'PENDING' || status === 'PAID' || status === 'REJECTED' || status === 'ACCEPTED';
  }

  get isInvestorPaymentRejected(): boolean {
    return this.ownInvestmentRecord?.status === 'REJECTED';
  }

  get chosenInvestorRecords(): InvestmentRecord[] {
    const ids = this.investmentPackage?.investorIdList ?? [];
    if (!ids.length) return [];
    return this.packageInvestments.filter(r => ids.includes(r.investorId));
  }

  get crowdfundingPaymentAlreadyPaid(): boolean {
    if (!this.isInvestorRole || !this.isCrowdfundingType || !this.investmentPackage) return false;
    const uid = this.authService.getCurrentUser()?.id;
    if (!uid) return false;
    return this.packageInvestments.find(r => r.investorId === uid)?.status === 'PAID';
  }

  get ownInvestmentRecord(): InvestmentRecord | null {
    const uid = this.authService.getCurrentUser()?.id;
    if (!uid) return null;
    return this.packageInvestments.find(r => r.investorId === uid) ?? null;
  }

  get effectiveCrowdfundingAttachmentId(): string | null {
    return this.ownInvestmentRecord?.attachmentId ?? this.crowdfundingPaymentReceiptAttachmentId;
  }

  get effectiveBiddingAttachmentId(): string | null {
    return this.ownInvestmentRecord?.attachmentId ?? this.paymentReceiptAttachmentId;
  }

  get payingInvestorRecord(): InvestmentRecord | null {
    if (!this.investmentPackage) return null;
    if (!this.isBiddingType && !this.isCrowdfundingType) {
      return this.packageInvestments[0] ?? null;
    }
    return this.packageInvestments.find(r => r.status === 'PENDING' || r.status === 'PAID') ?? null;
  }

  getBankAccountById(id?: string | null): BankAccount | undefined {
    if (!id) return undefined;
    return this.bankAccounts.find(b => b.id === id);
  }

  formatPaymentMethod(method?: string | null): string {
    if (!method) return '-';
    const labels: Record<string, string> = {
      CREDIT: 'Credit / Direct',
      BANK_TRANSFER: 'Bank Transfer',
      CRYPTO: 'Cryptocurrency',
    };
    return labels[method] ?? method;
  }

  private maybeLoadBankAccounts(): void {
    if (this.bankAccountsLoaded) return;
    this.bankAccountsLoaded = true;
    this.systemConfigService.getActiveBankAccounts().subscribe({
      next: (accounts) => { this.bankAccounts = accounts; },
      error: () => {},
    });
  }

  get isLosingBidder(): boolean {
    if (!this.isInvestorRole || !this.isBiddingType || !this.investmentPackage) return false;
    const currentUserId = this.authService.getCurrentUser()?.id;
    if (!currentUserId) return false;
    const ownRecord = this.packageInvestments.find(r => r.investorId === currentUserId);
    return ownRecord?.status === 'BACKUP';
  }

  /** True whenever the current investor already has a live (non-canceled) bid on this package,
   * regardless of its outcome — used to keep "Invest Now" from reappearing once they've bid. */
  get hasAppliedForBidding(): boolean {
    if (!this.isInvestorRole || !this.isBiddingType || !this.investmentPackage) return false;
    const currentUserId = this.authService.getCurrentUser()?.id;
    if (!currentUserId) return false;
    return this.packageInvestments.some(r => r.investorId === currentUserId && r.status !== 'CANCELED');
  }

  /** True once the current investor's ID appears in investorIdList for a CROWDFUNDING package. */
  get hasAppliedForCrowdfunding(): boolean {
    if (!this.isInvestorRole || !this.isCrowdfundingType || !this.investmentPackage) return false;
    const currentUserId = this.authService.getCurrentUser()?.id;
    if (!currentUserId) return false;
    return this.investmentPackage.investorIdList?.includes(currentUserId) ?? false;
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

  get confirmedInvestorCount(): number {
    const ids = this.investmentPackage?.investorIdList ?? [];
    return ids.filter(id => this.packageInvestments.find(r => r.investorId === id)?.status !== 'REJECTED').length;
  }

  get investorProgressPercent(): number {
    const current = this.confirmedInvestorCount;
    const expected = this.investmentPackage?.expectedInvestorNumber ?? 0;
    if (!expected) return 0;
    return Math.min(100, Math.round((current / expected) * 100));
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
    if (tab === 'extension-worker' && this.authService.isAdmin() && this.extensionWorkers.length === 0 && !this.loadingExtensionWorkers) {
      this.loadExtensionWorkers();
    }
    if (!this.isInvestorRole && tab === 'investor') {
      this.maybeLoadClosedLeaseInvestors();
    }
    if (tab === 'contract') {
      this.maybeLoadAgreement();
    }
  }

  /** Opens the Verify & Assign modal directly from the contract banner, instead of silently
   *  switching to the Extension Worker tab and leaving the admin to notice the form on their own. */
  openAssignExtensionWorkerModal(): void {
    this.showAssignExtensionWorkerModal = true;
    if (this.extensionWorkers.length === 0 && !this.loadingExtensionWorkers) {
      this.loadExtensionWorkers();
    }
  }

  get canConfirmCandidates(): boolean {
    if (this.isBiddingType) {
      return this.selectedCandidateIds.length === 1;
    }
    if (this.isCrowdfundingType) {
      return this.selectedCandidateIds.length > 0;
    }
    return !!this.investmentPackage?.attachmentIdList?.length && this.investmentPackage?.paymentStatus === 'PENDING';
  }

  /** True for every candidate except the already-committed winner, once any candidate has reached
   *  PAID/ACCEPTED/ACTIVE — used to grey out and disable the rest of the selection grid. */
  isCandidateLocked(record: InvestmentRecord): boolean {
    return this.hasPaidOrAcceptedCandidate
      && record.status !== 'PAID' && record.status !== 'ACCEPTED' && record.status !== 'ACTIVE';
  }

  /** Once any candidate has submitted (or had approved) a payment receipt — or gone on to sign
   *  the contract (ACTIVE), even further committed — the winner can no longer be changed. */
  get hasPaidOrAcceptedCandidate(): boolean {
    return this.packageInvestments.some(r => r.status === 'PAID' || r.status === 'ACCEPTED' || r.status === 'ACTIVE');
  }

  get canCreateAgreement(): boolean {
    if (this.isCrowdfundingType) {
      const ids = this.investmentPackage?.investorIdList ?? [];
      if (!ids.length) return false;
      return ids.every(id => {
        const rec = this.packageInvestments.find(r => r.investorId === id);
        return rec?.status === 'ACCEPTED';
      });
    }
    return !!this.investmentPackage?.attachmentIdList?.length;
  }

  getInvestorAvatarUrl(profileUrl: string | null | undefined): string | null {
    return profileUrl || null;
  }

  getFileUrl(fileId: string | null | undefined): string | null {
    return fileId ? `${environment.apiUrl}${Endpoints.STORAGE_ENDPOINT}/${fileId}` : null;
  }

  openAttachmentPreview(attachmentId: string): void {
    const url = this.attachmentMetadata[attachmentId]?.presignedUrl || this.getFileUrl(attachmentId);
    if (!url) return;

    if (this.getAttachmentIcon(attachmentId) === 'image') {
      const imageIds = (this.investmentPackage?.attachmentIdList ?? []).filter(
        (id) => this.getAttachmentIcon(id) === 'image',
      );
      this.attachmentModalUrls = imageIds
        .map((id) => this.attachmentMetadata[id]?.presignedUrl || this.getFileUrl(id))
        .filter((u): u is string => !!u);
      this.attachmentModalIndex = Math.max(0, imageIds.indexOf(attachmentId));
      this.showAttachmentModal = true;
    } else {
      this.filePreviewUrl = url;
      this.showFilePreviewModal = true;
    }
  }

  openSingleAttachmentPreview(attachmentId: string): void {
    const url = this.attachmentMetadata[attachmentId]?.presignedUrl || this.getFileUrl(attachmentId);
    if (!url) return;
    if (this.getAttachmentIcon(attachmentId) === 'image') {
      this.attachmentModalUrls = [url];
      this.attachmentModalIndex = 0;
      this.showAttachmentModal = true;
    } else {
      this.filePreviewUrl = url;
      this.showFilePreviewModal = true;
    }
  }

  assignExtensionWorker(): void {
    if (this.assigningExtensionWorker) {
      return; // a request is already in flight (e.g. Enter pressed again)
    }
    const investmentPackageId = this.investmentPackage?.id;
    const farmPlotId = this.investmentPackage?.farmPlotId || this.investmentPackage?.farmPlot?.id;
    const agreementId = this.investmentPackage?.agreementId;
    if (!investmentPackageId || !farmPlotId || !agreementId) {
      this.toastService.error('Package data is incomplete — please refresh and try again.');
      return;
    }
    if (!this.selectedExtensionWorkerId) {
      this.toastService.error('Please select an extension worker first.');
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
        this.showAssignExtensionWorkerModal = false;
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

  candidateStatusLabel(status: InvestmentStatus | undefined): string {
    switch (status) {
      case 'PENDING': return 'Winner (Awaiting Response)';
      case 'PAID': return 'Responded';
      case 'BACKUP': return 'Backup';
      case 'ACTIVE': return 'Active';
      case 'ACCEPTED': return 'Accepted';
      case 'REJECTED': return 'Rejected';
      case 'CANCELED': return 'Canceled';
      case 'FAILED': return 'Failed';
      case 'SENT': return 'Applied';
      default: return '-';
    }
  }

  candidateStatusBadgeClass(status: InvestmentStatus | undefined): Record<string, boolean> {
    return {
      'bg-green-100 text-green-700': status === 'ACTIVE' || status === 'ACCEPTED',
      'bg-yellow-100 text-yellow-700': status === 'PENDING',
      'bg-blue-100 text-blue-700': status === 'PAID',
      'bg-gray-200 text-gray-700': status === 'BACKUP' || status === 'SENT',
      'bg-red-100 text-red-700': status === 'FAILED' || status === 'REJECTED' || status === 'CANCELED',
    };
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
    if (!pkg || (pkg.fundingStatus !== FundingStatus.CLOSED && pkg.fundingStatus !== FundingStatus.FUNDED)) {
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

    if (!this.investmentPackage?.id) {
      this.closedLeaseInvestors = [];
      return;
    }

    this.closedLeaseInvestorsLoading = true;
    this.investmentPackageService.getClosedLeaseInvestors(this.investmentPackage.id).subscribe({
      next: (users) => {
        this.closedLeaseInvestors = users ?? [];
        this.closedLeaseInvestorsLoading = false;
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

  get isWinnerChange(): boolean {
    return this.investmentPackage?.fundingStatus === 'CLOSED';
  }

  /** Admin can complete once the contract is signed (agreement created) and an extension worker
   *  is assigned (which flips fundingStatus to FUNDED), and the package is not already completed. */
  get canCompleteInvestment(): boolean {
    return this.isAdminRole
      && !!this.investmentPackage?.id
      && !!this.investmentPackage?.agreementId
      && !!this.investmentPackage?.extensionWorker
      && this.investmentPackage?.fundingStatus === FundingStatus.FUNDED
      && this.investmentPackage?.packageStatus !== 'COMPLITED';
  }

  get isInvestmentCompleted(): boolean {
    return this.investmentPackage?.packageStatus === 'COMPLITED';
  }

  openCompleteModal(): void {
    if (!this.canCompleteInvestment) return;
    this.completionRemark = '';
    this.showCompleteModal = true;
  }

  confirmCompleteInvestment(): void {
    const packageId = this.investmentPackage?.id;
    const remark = this.completionRemark.trim();
    if (!packageId || !remark || this.completing || !this.canCompleteInvestment) return;

    this.completing = true;
    this.investmentPackageService.completeInvestmentPackage(packageId, remark).subscribe({
      next: () => {
        this.completing = false;
        this.showCompleteModal = false;
        this.completionRemark = '';
        this.toastService.success('Investment package completed successfully');
        this.completed.emit();
      },
      error: (error) => {
        this.completing = false;
        this.toastService.error(error.message || 'Failed to complete investment package', 'Complete Investment Package');
      },
    });
  }

  /** Admin can deactivate once the contract is signed (agreement created) and an extension worker
   *  is assigned (which flips fundingStatus to FUNDED), for as long as the package hasn't already
   *  reached a terminal state (completed or already deactivated). Mirrors canCompleteInvestment —
   *  both actions become available at the same point in the lifecycle, with opposite outcomes. */
  get canDeactivateInvestment(): boolean {
    return this.isAdminRole
      && !!this.investmentPackage?.id
      && !!this.investmentPackage?.agreementId
      && !!this.investmentPackage?.extensionWorker
      && this.investmentPackage?.fundingStatus === FundingStatus.FUNDED
      && this.investmentPackage?.packageStatus !== 'COMPLITED'
      && this.investmentPackage?.packageStatus !== 'INACTIVE';
  }

  /** Distinguishes "deactivated after going active" (had a signed contract) from a package closed
   *  while still OPEN, which never had an agreement and uses the same INACTIVE packageStatus. */
  get isInvestmentDeactivated(): boolean {
    return this.investmentPackage?.packageStatus === 'INACTIVE' && !!this.investmentPackage?.agreementId;
  }

  openDeactivateModal(): void {
    if (!this.canDeactivateInvestment) return;
    this.deactivationReason = '';
    this.showDeactivateModal = true;
  }

  confirmDeactivateInvestment(): void {
    const packageId = this.investmentPackage?.id;
    const reason = this.deactivationReason.trim();
    if (!packageId || !reason || this.deactivating || !this.canDeactivateInvestment) return;

    this.deactivating = true;
    this.investmentPackageService.deactivateInvestmentPackage(packageId, reason).subscribe({
      next: () => {
        this.deactivating = false;
        this.showDeactivateModal = false;
        this.deactivationReason = '';
        this.toastService.success('Investment package deactivated successfully');
        this.completed.emit();
      },
      error: (error) => {
        this.deactivating = false;
        this.toastService.error(error.message || 'Failed to deactivate investment package', 'Deactivate Investment Package');
      },
    });
  }

  get selectedCandidateNames(): string[] {
    return this.biddingCandidates
      .filter((record) => this.isCandidateSelected(record.investorId))
      .map((record) => this.formatWorkerName(record.investorUser));
  }

  openChooseWinnerModal(): void {
    if (this.selectedCandidateIds.length === 0 || this.choosingCandidates || !this.canConfirmCandidates) {
      return;
    }
    this.chooseWinnerRemark = '';
    this.showChooseWinnerModal = true;
  }

  confirmCandidates(): void {
    const investmentPackageId = this.investmentPackage?.id;
    const farmPlotId = this.investmentPackage?.farmPlotId || this.investmentPackage?.farmPlot?.id;
    const remark = this.chooseWinnerRemark.trim();
    if (
      !investmentPackageId ||
      !farmPlotId ||
      !remark ||
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
      remark,
    };

    this.choosingCandidates = true;
    this.investmentPackageService.chooseCandidates(request).subscribe({
      next: () => {
        this.choosingCandidates = false;
        this.showChooseWinnerModal = false;
        this.chooseWinnerRemark = '';
        this.selectedCandidateIds = chosenIds;
        this.toastService.success('Winning investor confirmed successfully', 'Winning Investor');
        this.candidatesChosen.emit();
      },
      error: (error) => {
        this.choosingCandidates = false;
        this.toastService.error(error.message || 'Failed to confirm winning investor', 'Winning Investor');
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

    if (this.isInvestorRole) {
      const currentUserId = this.authService.getCurrentUser()?.id;
      // For BIDDING packages, investorIdList holds every original applicant, not just the
      // winner, but the agreement is scoped to the winner only. Use the winner-only investorId
      // instead, so losing bidders don't attempt to fetch (and get rejected from) the agreement.
      const isOwner = this.isBiddingType
        ? !!currentUserId && this.investmentPackage?.investorId === currentUserId
        : !!currentUserId && !!this.investmentPackage?.investorIdList?.includes(currentUserId);
      if (!isOwner) {
        this.agreement = null;
        this.loadedAgreementId = null;
        return;
      }
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

  private maybeLoadAttachmentMetadata(): void {
    const ids = (this.investmentPackage?.attachmentIdList ?? []).filter((id) => !this.attachmentMetadata[id]);
    if (ids.length === 0) {
      return;
    }
    forkJoin(ids.map((id) => this.fileUploadService.getFileMetadata(id))).subscribe({
      next: (results) => {
        results.forEach((metadata, i) => {
          this.attachmentMetadata[ids[i]] = metadata;
        });
      },
      error: () => {
        // Leave missing entries out of the map; getAttachmentIcon() falls back to a generic icon.
      },
    });
  }

  private maybeLoadInvestorRecordAttachmentMetadata(): void {
    const ids = this.packageInvestments
      .map(r => r.attachmentId)
      .filter((id): id is string => !!id && !this.attachmentMetadata[id]);
    if (ids.length === 0) return;
    forkJoin(ids.map(id => this.fileUploadService.getFileMetadata(id))).subscribe({
      next: (results) => {
        results.forEach((metadata, i) => { this.attachmentMetadata[ids[i]] = metadata; });
      },
      error: () => {},
    });
  }

  getAttachmentIcon(attachmentId: string): 'image' | 'pdf' | 'document' {
    const contentType = this.attachmentMetadata[attachmentId]?.contentType;
    if (!contentType) return 'document';
    if (contentType === 'application/pdf') return 'pdf';
    if (contentType.startsWith('image/')) return 'image';
    return 'document';
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

  private maybeLoadOwnBidRecord(): void {
    if (this.isChosenBidder && this.ownBidRecordPackageId !== this.investmentPackage?.id) {
      this.loadOwnBidRecord();
    }
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

  submitCrowdfundingPayment(): void {
    const packageId = this.investmentPackage?.id;
    const farmPlotId = this.investmentPackage?.farmPlotId || this.investmentPackage?.farmPlot?.id;
    const uid = this.authService.getCurrentUser()?.id;
    const ownRecord = uid ? this.packageInvestments.find(r => r.investorId === uid) : null;
    if (!packageId || !farmPlotId || !ownRecord?.id || !this.crowdfundingPaymentReceiptAttachmentId || this.submittingCrowdfundingPayment) {
      return;
    }

    const request: InvestorAgreeResponseRequest = {
      investmentPackageId: packageId,
      investmentRecordId: ownRecord.id,
      farmPlotId,
      attachmentId: this.crowdfundingPaymentReceiptAttachmentId,
    };

    this.submittingCrowdfundingPayment = true;
    this.investmentPackageService.investorAgreeResponse(request).subscribe({
      next: () => {
        this.submittingCrowdfundingPayment = false;
        this.crowdfundingPaymentSubmitted = true;
        this.toastService.success('Payment receipt submitted successfully');
        this.agreementCreated.emit();
      },
      error: (error) => {
        this.submittingCrowdfundingPayment = false;
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

  approveInvestorPayment(record: InvestmentRecord): void {
    if (this.approvingInvestorId) {
      return; // a request is already in flight (e.g. Enter pressed again)
    }
    this.approvingInvestorId = record.id;
    this.investmentPackageService.investorDecision(record.id, 'ACCEPTED').subscribe({
      next: () => {
        this.approvingInvestorId = null;
        this.candidatesChosen.emit();
        this.toastService.success('Payment approved');
      },
      error: (e) => {
        this.approvingInvestorId = null;
        this.toastService.error(e.message || 'Failed to approve payment', 'Approve Payment');
      },
    });
  }

  showRejectForm(record: InvestmentRecord): void {
    this.rejectingInvestorId = record.id;
    this.rejectionReasonInput = '';
  }

  cancelRejectForm(): void {
    this.rejectingInvestorId = null;
    this.rejectionReasonInput = '';
  }

  rejectInvestorPayment(record: InvestmentRecord, reason: string): void {
    if (this.approvingInvestorId) {
      return; // a request is already in flight (e.g. Enter pressed again)
    }
    if (!reason.trim()) return;
    this.approvingInvestorId = record.id;
    this.rejectingInvestorId = null;
    this.rejectionReasonInput = '';
    this.investmentPackageService.investorDecision(record.id, 'REJECTED', reason.trim()).subscribe({
      next: () => {
        this.approvingInvestorId = null;
        this.candidatesChosen.emit();
        this.toastService.success('Payment rejected — investor can re-upload');
      },
      error: (e) => {
        this.approvingInvestorId = null;
        this.toastService.error(e.message || 'Failed to reject payment', 'Reject Payment');
      },
    });
  }

  paymentStatusLabel(status: string | undefined): string {
    const labels: Record<string, string> = {
      PENDING: 'Waiting',
      PAID: 'Submitted',
      ACCEPTED: 'Approved',
      REJECTED: 'Rejected',
      ACTIVE: 'Active',
    };
    return labels[status ?? ''] ?? (status ?? '-');
  }

  paymentStatusBadgeClass(status: string | undefined): Record<string, boolean> {
    return {
      'bg-yellow-100 text-yellow-700': status === 'PENDING',
      'bg-blue-100 text-blue-700': status === 'PAID',
      'bg-green-100 text-green-700': status === 'ACCEPTED' || status === 'ACTIVE',
      'bg-red-100 text-red-700': status === 'REJECTED',
      'bg-gray-100 text-gray-600': !status,
    };
  }
}
