import {Component, inject, Input, OnChanges, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {FarmFollowUp, FarmFollowUpReport, FarmFollowUpReportCreateRequest} from '../../models/farm-followup.model';
import {DetailCardComponent} from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import {DetailSectionComponent} from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import {DetailFieldComponent} from '../../../../shared/components/detail-field/detail-field/detail-field.component';
import {DocumentUploadComponent} from '../../../../shared/file-upload/document-upload/document-upload.component';
import {FarmFollowUpService} from '../../services/farm-followup.service';
import {AuthService} from '../../../auth/services/auth.service';
import {FileUploadService} from '../../../../shared/file-upload/file-upload.service';
import {ToastService} from '../../../../shared/toast/toast.service';

@Component({
  selector: 'app-farm-followup-view',
  standalone: true,
  imports: [CommonModule, FormsModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent, DocumentUploadComponent],
  templateUrl: './farm-followup-view.component.html',
})
export class FarmFollowUpViewComponent implements OnChanges {
  @Input() followUp: FarmFollowUp | null = null;

  private readonly farmFollowUpService = inject(FarmFollowUpService);
  private readonly authService = inject(AuthService);
  private readonly fileUploadService = inject(FileUploadService);
  private readonly toastService = inject(ToastService);

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['followUp']) {
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
}
