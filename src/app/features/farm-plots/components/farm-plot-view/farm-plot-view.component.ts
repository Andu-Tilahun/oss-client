import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {Router} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {FarmGallery, FarmPlot, FarmPlotMaintenanceRequest, FarmPlotStatus} from '../../models/farm-plot.model';
import {FarmPlotService} from '../../services/farm-plot.service';
import {DetailCardComponent} from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import {DetailSectionComponent} from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import {DetailFieldComponent} from '../../../../shared/components/detail-field/detail-field/detail-field.component';
import {OssMapComponent} from '../../../../shared/oss-map/oss-map.component';
import {ImageGalleryModalComponent} from '../../../../shared/modals/image-gallery-modal/image-gallery-modal.component';
import {ImageUploadModalComponent} from '../../../../shared/modals/image-upload-modal/image-upload-modal.component';
import {ConfirmationModalComponent} from '../../../../shared/modals/confirmation-modal/confirmation-modal.component';
import {FarmPlotMaintenanceModalComponent} from '../../modals/farm-plot-maintenance-modal/farm-plot-maintenance-modal.component';
import {ToastService} from '../../../../shared/toast/toast.service';
import {environment} from '../../../../../environments/environment';
import {InvestmentPackageService} from '../../../investment-package/services/investment-package.service';
import {InvestmentPackage} from '../../../investment-package/models/investment-package.model';
import {packageStatusBadgeClass} from '../../../investment-package/utils/investment-package-status.util';
import {AuthService} from '../../../auth/services/auth.service';
import {TabsComponent} from '../../../../shared/tabs/app-tabs/app-tabs.component';
import {TabItem} from '../../../../shared/tabs/models/tab-item.model';

@Component({
  selector: 'app-farm-plot-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DetailCardComponent,
    DetailSectionComponent,
    DetailFieldComponent,
    OssMapComponent,
    ImageGalleryModalComponent,
    ImageUploadModalComponent,
    ConfirmationModalComponent,
    FarmPlotMaintenanceModalComponent,
    TabsComponent,
  ],
  templateUrl: './farm-plot-view.component.html',
})
export class FarmPlotViewComponent implements OnChanges {
  /**
   * Optional: if `plot` is provided, the component uses it directly (no extra API call).
   * Otherwise it will fetch by `id`.
   */
  @Input() plot: FarmPlot | null = null;

  /** Used when `plot` is not provided. */
  @Input() id?: string;

  @Input() refreshKey = 0;
  @Input() showStatusActions = true;
  @Input() showCreateLeaseButton = false;
  @Input() createLeaseButtonText = 'Create Lease Agreement';
  @Input() hideInvestmentHistoryForExtensionWorker = false;
  @Output() createLease = new EventEmitter<void>();

  /** Emitted after this plot's status is changed via the actions below, so the parent list can refresh. */
  @Output() statusChanged = new EventEmitter<void>();

  showMaintenanceModal = false;
  maintenanceSubmitting = false;
  maintenanceReason = '';

  showRepairModal = false;
  repairSubmitting = false;

  showArchiveModal = false;
  archiveSubmitting = false;

  get allowGalleryUpload(): boolean {
    return this.authService.isAdmin();
  }

  loading = false;
  error: string | null = null;
  galleryItems: FarmGallery[] = [];
  previewGalleryUrls: string[] = [];
  allGalleryUrls: string[] = [];
  previewImageUrls: string[] = [];
  galleryLoading = false;
  showGalleryModal = false;
  galleryModalInitialIndex = 0;
  showUploadModal = false;
  galleryUploading = false;

  plotInvestmentPackages: InvestmentPackage[] = [];
  packagesLoading = false;

  activeTab = 'description';
  tabs: TabItem[] = [];
  private previousPlotId?: string;

  private readonly storageApiUrl = `${environment.apiUrl}/files`;

  constructor(
    private farmPlotService: FarmPlotService,
    private toastService: ToastService,
    private investmentPackageService: InvestmentPackageService,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['plot']) {
      if (this.plot) {
        this.loading = false;
        this.error = null;
        this.onPlotResolved(this.plot.id);
        this.loadGallery(this.plot.id);
        this.loadInvestmentPackages(this.plot.id);
      } else if (this.id) {
        this.clearGallery();
        this.loadFromApi();
      } else {
        this.clearGallery();
        this.plotInvestmentPackages = [];
        this.tabs = [];
        this.previousPlotId = undefined;
      }
      return;
    }

    if (changes['refreshKey'] && this.plot?.id) {
      this.loadGallery(this.plot.id);
      return;
    }

    if (changes['id'] && !this.plot) {
      this.loadFromApi();
    }
  }

  private loadFromApi(): void {
    if (!this.id) return;

    this.loading = true;
    this.error = null;

    this.farmPlotService.getFarmPlotById(this.id).subscribe({
      next: (plot) => {
        this.plot = plot ?? null;
        this.loading = false;
        if (this.plot?.id) {
          this.onPlotResolved(this.plot.id);
          this.loadGallery(this.plot.id);
          this.loadInvestmentPackages(this.plot.id);
        } else {
          this.clearGallery();
          this.plotInvestmentPackages = [];
          this.tabs = [];
        }
      },
      error: () => {
        this.plot = null;
        this.error = 'Failed to load farm plot';
        this.loading = false;
        this.clearGallery();
        this.plotInvestmentPackages = [];
        this.tabs = [];
      },
    });
  }

  /** Resets to the Description tab when a *different* plot is now shown, then recomputes the tab list. */
  private onPlotResolved(plotId: string): void {
    if (plotId !== this.previousPlotId) {
      this.activeTab = 'description';
    }
    this.previousPlotId = plotId;
    this.recomputeTabs();
  }

  private get hideInvestmentHistory(): boolean {
    return this.authService.isInvestor()
      || (this.hideInvestmentHistoryForExtensionWorker && this.authService.isExtensionWorker());
  }

  private recomputeTabs(): void {
    this.tabs = [
      {key: 'description', label: 'Description'},
      ...(this.hideInvestmentHistory ? [] : [{
        key: 'investment-history',
        label: 'Investment History',
        badge: this.plotInvestmentPackages.length || undefined,
      }]),
      ...(this.showStatusActions && this.canManageStatus
        && (this.plot?.status === 'ACTIVE' || this.plot?.status === 'UNDER_MAINTENANCE')
        ? [{key: 'actions', label: 'Actions'}]
        : []),
    ];
    if (!this.tabs.some((t) => t.key === this.activeTab)) {
      this.activeTab = 'description';
    }
  }

  onTabChange(key: string): void {
    this.activeTab = key;
  }

  private loadInvestmentPackages(plotId: string): void {
    if (this.hideInvestmentHistory) {
      this.plotInvestmentPackages = [];
      this.recomputeTabs();
      return;
    }
    this.packagesLoading = true;
    this.investmentPackageService.filterInvestmentPackages({ farmPlotId: plotId, page: 0, size: 50 }).subscribe({
      next: (res) => {
        this.plotInvestmentPackages = this.sortByFundingDeadline(res.content);
        this.packagesLoading = false;
        this.recomputeTabs();
      },
      error: () => {
        this.plotInvestmentPackages = [];
        this.packagesLoading = false;
        this.recomputeTabs();
      },
    });
  }

  /** Soonest/most-recent funding deadline first; entries with no deadline sort to the end. */
  private sortByFundingDeadline(packages: InvestmentPackage[]): InvestmentPackage[] {
    return packages.slice().sort((a, b) => {
      if (!a.fundingDeadline && !b.fundingDeadline) return 0;
      if (!a.fundingDeadline) return 1;
      if (!b.fundingDeadline) return -1;
      return new Date(b.fundingDeadline).getTime() - new Date(a.fundingDeadline).getTime();
    });
  }

  private loadGallery(plotId: string): void {
    this.galleryLoading = true;
    this.galleryItems = [];
    this.previewGalleryUrls = [];
    this.allGalleryUrls = [];

    this.farmPlotService.getFarmPlotGallery(plotId).subscribe({
      next: (gallery) => {
        this.galleryItems = gallery.slice().sort((a, b) => a.sortOrder - b.sortOrder);
        this.allGalleryUrls = this.galleryItems
          .map((item) => this.toStorageUrl(item.imageUuid))
          .filter((url): url is string => !!url);
        this.previewGalleryUrls = this.allGalleryUrls.slice(0, 3);
        this.galleryLoading = false;
      },
      error: () => {
        this.clearGallery();
      },
    });
  }

  private clearGallery(): void {
    this.galleryItems = [];
    this.previewGalleryUrls = [];
    this.allGalleryUrls = [];
    this.galleryLoading = false;
  }

  get galleryTitle(): string {
    return this.plot?.title ? `${this.plot.title} Gallery` : 'Image Gallery';
  }

  openGallery(startIndex: number): void {
    if (this.allGalleryUrls.length === 0) {
      return;
    }
    this.previewImageUrls = this.allGalleryUrls;
    this.galleryModalInitialIndex = startIndex;
    this.showGalleryModal = true;
  }

  openGalleryUpload(): void {
    this.showUploadModal = true;
  }

  onGalleryImageUploaded(imageUuid: string): void {
    if (this.galleryUploading) {
      return; // a request is already in flight
    }
    if (!this.plot?.id) {
      return;
    }

    this.galleryUploading = true;
    this.farmPlotService.addFarmPlotGalleryImage(this.plot.id, {imageUuid}).subscribe({
      next: () => {
        this.galleryUploading = false;
        this.toastService.success('Gallery image added successfully');
        this.loadGallery(this.plot!.id);
      },
      error: (err) => {
        this.galleryUploading = false;
        this.toastService.error(err?.message || 'Failed to add gallery image', 'Gallery');
      },
    });
  }

  onGalleryUploadError(message: string): void {
    this.toastService.error(message, 'Gallery');
  }

  getMainImageUrl(): string | null {
    return this.plot?.imageUuid ? this.toStorageUrl(this.plot.imageUuid) : null;
  }

  openImagePreview(url: string): void {
    if (!url) {
      return;
    }
    this.previewImageUrls = [url];
    this.galleryModalInitialIndex = 0;
    this.showGalleryModal = true;
  }

  private toStorageUrl(imageUuid?: string): string | null {
    return imageUuid ? `${this.storageApiUrl}/${imageUuid}` : null;
  }

  statusPillClass(status: FarmPlotStatus | undefined): string {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'INACTIVE':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      case 'UNDER_MAINTENANCE':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  }

  sizeText(p: FarmPlot): string {
    return `${p.size} ${p.sizeType}`;
  }

  onCreateLease(): void {
    this.createLease.emit();
  }

  navigateToPackage(pkg: InvestmentPackage): void {
    const typeSegment = (pkg.investmentPackageType ?? 'LEASING').toLowerCase();
    const tab = pkg.packageStatus === 'INACTIVE' || pkg.packageStatus === 'COMPLITED' ? 'archived' : 'published';
    this.router.navigate(['/investment-package-types', typeSegment], {
      queryParams: {packageId: pkg.id, tab},
    });
  }

  formatStatus(status: string | undefined): string {
    return (status ?? 'ACTIVE')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  pkgStatusClass(pkg: InvestmentPackage): string {
    return packageStatusBadgeClass(pkg.packageStatus);
  }

  get canManageStatus(): boolean {
    return this.authService.isAdmin();
  }

  onMarkUnderMaintenance(): void {
    this.maintenanceReason = '';
    this.showMaintenanceModal = true;
  }

  handleMaintenanceConfirm(): void {
    if (this.maintenanceSubmitting) {
      return; // a request is already in flight
    }
    if (!this.plot?.id || !this.maintenanceReason.trim()) return;
    this.maintenanceSubmitting = true;
    const request: FarmPlotMaintenanceRequest = {reason: this.maintenanceReason.trim()};
    this.farmPlotService.markUnderMaintenance(this.plot.id, request).subscribe({
      next: () => {
        this.maintenanceSubmitting = false;
        this.showMaintenanceModal = false;
        this.toastService.success('Farm plot marked under maintenance');
        this.statusChanged.emit();
      },
      error: (err) => {
        this.maintenanceSubmitting = false;
        this.toastService.error(err.message || 'Failed to update farm plot', 'Mark Under Maintenance');
      },
    });
  }

  onMarkRepaired(): void {
    this.showRepairModal = true;
  }

  confirmMarkRepaired(): void {
    if (this.repairSubmitting) {
      return; // a request is already in flight
    }
    if (!this.plot?.id) return;
    this.repairSubmitting = true;
    this.farmPlotService.markRepaired(this.plot.id).subscribe({
      next: () => {
        this.repairSubmitting = false;
        this.showRepairModal = false;
        this.toastService.success('Farm plot marked as repaired');
        this.statusChanged.emit();
      },
      error: (err) => {
        this.repairSubmitting = false;
        this.toastService.error(err.message || 'Failed to update farm plot', 'Mark Repaired');
      },
    });
  }

  onArchive(): void {
    this.showArchiveModal = true;
  }

  confirmArchive(): void {
    if (this.archiveSubmitting) {
      return; // a request is already in flight
    }
    if (!this.plot?.id) return;
    this.archiveSubmitting = true;
    this.farmPlotService.deactivateFarmPlot(this.plot.id).subscribe({
      next: () => {
        this.archiveSubmitting = false;
        this.showArchiveModal = false;
        this.toastService.success('Farm plot archived successfully');
        this.statusChanged.emit();
      },
      error: (err) => {
        this.archiveSubmitting = false;
        this.toastService.error(err.message || 'Failed to archive farm plot', 'Archive');
      },
    });
  }
}
