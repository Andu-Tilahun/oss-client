import {Component, ElementRef, EventEmitter, inject, Input, OnChanges, OnDestroy, Output, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {FarmFollowUp, FarmFollowUpReport, FarmFollowUpReportCreateRequest} from '../../models/farm-followup.model';
import {hasDeadlinePassed} from '../../utils/follow-up-deadline.util';
import {DeadlineChip, deadlineChip, deadlineClass, formatDate, statusClass} from '../../utils/follow-up-display.util';
import {User} from '../../../users/models/user.model';
import {DetailCardComponent} from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import {DetailFieldComponent} from '../../../../shared/components/detail-field/detail-field/detail-field.component';
import {DocumentUploadComponent} from '../../../../shared/file-upload/document-upload/document-upload.component';
import {FarmFollowUpService} from '../../services/farm-followup.service';
import {AuthService} from '../../../auth/services/auth.service';
import {FileUploadService} from '../../../../shared/file-upload/file-upload.service';
import {ToastService} from '../../../../shared/toast/toast.service';

type SectionKey = 'details' | 'attachment' | 'reports' | 'audit';

@Component({
  selector: 'app-farm-followup-view',
  standalone: true,
  imports: [CommonModule, FormsModule, DetailCardComponent, DetailFieldComponent, DocumentUploadComponent],
  templateUrl: './farm-followup-view.component.html',
})
export class FarmFollowUpViewComponent implements OnChanges, OnDestroy {
  @Input() followUp: FarmFollowUp | null = null;
  @Input() readOnly = false;
  /** Whether the current user may mark this follow-up Done/Excluded (decided by the list page). */
  @Input() canAct = false;
  @Output() outcomeRequested = new EventEmitter<'DONE' | 'EXCLUDED'>();

  private readonly farmFollowUpService = inject(FarmFollowUpService);
  private readonly authService = inject(AuthService);
  private readonly fileUploadService = inject(FileUploadService);
  private readonly toastService = inject(ToastService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Remark / outcome reason longer than this are clamped behind Show more. */
  private static readonly LONG_TEXT_CHARS = 240;
  private static readonly LONG_TEXT_LINES = 4;
  private static readonly COPIED_MS = 2000;

  openSections: Record<SectionKey, boolean> = {details: true, attachment: false, reports: true, audit: false};
  expandedText: Record<string, boolean> = {};
  copied = false;
  private copiedTimer?: ReturnType<typeof setTimeout>;

  reports: FarmFollowUpReport[] = [];
  reportsLoading = false;
  isExtensionWorker = false;

  showAddReportForm = false;
  reportContent = '';
  reportFileUuids: string[] = [];
  reportFileSlots: number[] = [0];
  fileContentTypes: { [uuid: string]: string } = {};
  filePresignedUrls: { [uuid: string]: string } = {};
  fileNames: { [uuid: string]: string } = {};
  isSubmittingReport = false;

  /** New reports are only accepted while the follow-up is ACTIVE and its deadline has not passed. */
  get isReportable(): boolean {
    return this.followUp?.taskStatus === 'ACTIVE' && !hasDeadlinePassed(this.followUp.endDate);
  }

  get canAddReport(): boolean {
    return this.isExtensionWorker && !this.readOnly && this.isReportable;
  }

  /** Why the Add Report button is missing, shown to the extension worker instead of it. */
  get reportBlockedReason(): string {
    const status = this.followUp?.taskStatus;
    if (status && status !== 'ACTIVE') {
      return `This follow-up is ${status.toLowerCase()}, so no new reports can be added.`;
    }
    return 'The deadline for this follow-up has passed, so no new reports can be added.';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['followUp']) {
      this.resetView();
      this.isExtensionWorker = this.authService.isExtensionWorker();
      if (this.followUp?.id) {
        this.loadReports();
      } else {
        this.reports = [];
        this.fileContentTypes = {};
        this.filePresignedUrls = {};
        this.fileNames = {};
      }
    }
    if ((changes['followUp'] || changes['readOnly']) && !this.canAddReport) {
      this.cancelAddReport(); // e.g. the follow-up was rejected while the form was open
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.copiedTimer);
  }

  private resetView(): void {
    this.openSections = {details: true, attachment: !!this.followUp?.attachment, reports: true, audit: false};
    this.expandedText = {};
    this.copied = false;
    clearTimeout(this.copiedTimer);
  }

  // ── Interactive bits ──────────────────────────────────────────────────────
  isOpen(section: SectionKey): boolean {
    return this.openSections[section];
  }

  toggleSection(section: SectionKey): void {
    this.openSections = {...this.openSections, [section]: !this.openSections[section]};
  }

  isLongText(text: string | null | undefined): boolean {
    if (!text) return false;
    return text.length > FarmFollowUpViewComponent.LONG_TEXT_CHARS
      || text.split('\n').length > FarmFollowUpViewComponent.LONG_TEXT_LINES;
  }

  isClamped(key: string, text: string | null | undefined): boolean {
    return this.isLongText(text) && !this.expandedText[key];
  }

  toggleText(key: string): void {
    this.expandedText = {...this.expandedText, [key]: !this.expandedText[key]};
  }

  async copyReference(): Promise<void> {
    const reference = this.followUp?.referenceNumber;
    if (!reference) return;
    try {
      await navigator.clipboard.writeText(reference);
    } catch {
      this.legacyCopy(reference);
    }
    this.copied = true;
    clearTimeout(this.copiedTimer);
    this.copiedTimer = setTimeout(() => (this.copied = false), FarmFollowUpViewComponent.COPIED_MS);
  }

  private legacyCopy(text: string): void {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand('copy');
    } finally {
      area.remove();
    }
  }

  /** Quick action: open the Reports section with the add form and bring it into view. */
  startAddReport(): void {
    if (!this.canAddReport) return;
    this.openSections = {...this.openSections, reports: true};
    this.showAddReportForm = true;
    setTimeout(() => this.host.nativeElement.querySelector('[data-add-report-form]')
      ?.scrollIntoView?.({behavior: 'smooth', block: 'nearest'}));
  }

  requestOutcome(action: 'DONE' | 'EXCLUDED'): void {
    if (this.canAct && this.followUp?.taskStatus === 'ACTIVE') {
      this.outcomeRequested.emit(action);
    }
  }

  // The detail card is always white (even in dark mode), so the pills use the light styles.
  get statusPillClass(): string {
    return statusClass(this.followUp?.taskStatus, false);
  }

  get deadline(): DeadlineChip | null {
    return this.followUp ? deadlineChip(this.followUp) : null;
  }

  deadlinePillClass(chip: DeadlineChip): string {
    return deadlineClass(chip, false);
  }

  formatDate(value?: string | null): string {
    return formatDate(value);
  }

  private loadReports(): void {
    if (!this.followUp?.id) return;
    this.reportsLoading = true;
    this.fileContentTypes = {};
    this.filePresignedUrls = {};
    this.fileNames = {};
    this.farmFollowUpService.getReports(this.followUp.id).subscribe({
      next: (data) => {
        this.reports = data ?? [];
        this.reportsLoading = false;
        this.resolveContentTypes();
      },
      error: () => {
        this.reportsLoading = false;
      },
    });
  }

  private resolveContentTypes(): void {
    const allUuids = new Set<string>();
    this.reports.forEach(r => r.fileUuids?.forEach(uuid => allUuids.add(uuid)));
    allUuids.forEach(uuid => {
      if (!this.fileContentTypes[uuid]) {
        this.fileUploadService.getFileMetadata(uuid).subscribe({
          next: (meta) => {
            this.fileContentTypes[uuid] = meta.contentType;
            this.filePresignedUrls[uuid] = meta.presignedUrl;
            this.fileNames[uuid] = meta.originalFilename;
          },
          error: () => {
            this.fileContentTypes[uuid] = 'unknown';
          },
        });
      }
    });
  }

  isVideo(uuid: string): boolean {
    return this.fileContentTypes[uuid]?.startsWith('video') ?? false;
  }

  isFileMetadataLoading(uuid: string): boolean {
    return !this.fileContentTypes[uuid];
  }

  getFileUrl(fileId: string | null | undefined): string | null {
    return fileId ? this.fileUploadService.getFileUrl(fileId) : null;
  }

  getStreamUrl(fileId: string | null | undefined): string | null {
    return fileId ? this.fileUploadService.getStreamUrl(fileId) : null;
  }

  openAttachment(fileId: string | null | undefined): void {
    const url = this.getFileUrl(fileId);
    if (url) window.open(url, '_blank');
  }

  openInNewTab(uuid: string): void {
    const url = this.filePresignedUrls[uuid] || this.fileUploadService.getFileUrl(uuid);
    window.open(url, '_blank');
  }

  downloadFile(uuid: string): void {
    const a = document.createElement('a');
    a.href = this.fileUploadService.getFileUrl(uuid)!;
    a.download = this.fileNames[uuid] || uuid;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  onReportFileUploaded(index: number, uuid: string): void {
    this.reportFileUuids[index] = uuid;
  }

  onReportFileRemoved(index: number): void {
    this.reportFileUuids.splice(index, 1);
    this.reportFileSlots.splice(index, 1);
    this.reportFileSlots = this.reportFileSlots.map((_, i) => i);
  }

  addFileSlot(): void {
    this.reportFileSlots = [...this.reportFileSlots, this.reportFileSlots.length];
    this.reportFileUuids.push('');
  }

  onAddReport(): void {
    if (this.isSubmittingReport) {
      return; // a request is already in flight
    }
    if (!this.canAddReport) {
      this.toastService.warning(this.reportBlockedReason, 'Report');
      return;
    }
    const content = this.reportContent.trim();
    const fileUuids = this.reportFileUuids.filter(u => !!u);
    if (!content && fileUuids.length === 0) {
      this.toastService.warning('Please enter report content or attach at least one file.', 'Report');
      return;
    }

    const request: FarmFollowUpReportCreateRequest = { content, fileUuids };
    this.isSubmittingReport = true;
    this.farmFollowUpService.addReport(this.followUp!.id, request).subscribe({
      next: () => {
        this.isSubmittingReport = false;
        this.cancelAddReport();
        this.loadReports();
        this.toastService.success('Report saved successfully');
      },
      error: (err) => {
        this.isSubmittingReport = false;
        this.toastService.error(err.message || 'Failed to save report', 'Report');
      },
    });
  }

  cancelAddReport(): void {
    this.showAddReportForm = false;
    this.reportContent = '';
    this.reportFileUuids = [];
    this.reportFileSlots = [0];
  }

  formatUserName(user: User | null | undefined): string {
    if (!user) return '-';
    return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || '-';
  }

  get completedByLabel(): string {
    if (!this.followUp || this.followUp.taskStatus === 'ACTIVE') return '-';
    if (!this.followUp.completedBy) return 'System';
    return this.formatUserName(this.followUp.completedByUser);
  }
}
