import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClearingAgentApplicantService } from '../../services/clearing-agent-applicant.service';
import { ClearingAgentApplicant } from '../../models/clearing-agent-applicant.model';
import { DocumentUploadComponent } from '../../../../../shared/file-upload/document-upload/document-upload.component';
import { FileUploadService } from '../../../../../shared/file-upload/file-upload.service';
import {DetailCardComponent} from "../../../../../shared/components/detail-field/detail-card/detail-card.component";
import {
  DetailSectionComponent
} from "../../../../../shared/components/detail-field/detail-section/detail-section.component";
import {DetailFieldComponent} from "../../../../../shared/components/detail-field/detail-field/detail-field.component";

@Component({
  selector: 'app-clearing-agent-applicant-view',
  standalone: true,
  imports: [CommonModule, DocumentUploadComponent, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './clearing-agent-applicant-view.component.html',
  styleUrls: ['./clearing-agent-applicant-view.component.css'],
})
export class ClearingAgentApplicantViewComponent implements OnInit {
  @Input() userRequestId?: string;

  applicant: ClearingAgentApplicant | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private applicantService: ClearingAgentApplicantService,
    private fileUploadService: FileUploadService,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!this.userRequestId) return;
    this.loading = true;
    this.error = null;
    this.applicantService.getByUserRequestId(this.userRequestId).subscribe({
      next: (a) => {
        this.applicant = a;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load applicant';
        this.applicant = null;
        this.loading = false;
      },
    });
  }

  get fullName(): string {
    const a = this.applicant;
    if (!a) return '';
    return [a.firstName, a.middleName, a.lastName].filter(Boolean).join(' ');
  }

  get photoUrl(): string | null {
    const id = this.applicant?.photoId;
    if (!id) return null;
    return this.fileUploadService.getFileUrl(id);
  }
}

