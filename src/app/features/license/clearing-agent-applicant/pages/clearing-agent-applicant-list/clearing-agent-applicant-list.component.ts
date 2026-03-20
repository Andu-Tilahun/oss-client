import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DataTableColumn } from '../../../../../shared/data-table/models/data-table-column.model';
import { TableQueryParams } from '../../../../../shared/data-table/models/table-query-params.model';
import { TrainingProgram, TrainingStatus } from '../../../training-program/models/training.model';
import { TrainingService } from '../../../training-program/services/training.service';
import {
  ClearingAgentApplicant,
  ClearingAgentApplicantFilterRequest,
  ClearingAgentApplicantType,
} from '../../models/clearing-agent-applicant.model';
import { ClearingAgentApplicantService } from '../../services/clearing-agent-applicant.service';
import { PageResponse } from '../../../../../shared/models/api-response.model';

@Component({
  selector: 'app-clearing-agent-applicant-list',
  standalone: false,
  templateUrl: './clearing-agent-applicant-list.component.html',
})
export class ClearingAgentApplicantListComponent implements OnInit {
  applicants: ClearingAgentApplicant[] = [];
  trainingPrograms: TrainingProgram[] = [];

  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  currentPage = 0;

  // Filters
  searchText = '';
  selectedApplicantTypes: ClearingAgentApplicantType[] = [];
  selectedTrainingProgramId = '';

  readonly applicantTypes: ClearingAgentApplicantType[] = [
    'PRIVATE',
    'FORMER_EMPLOYEE',
    'REGIONAL',
    'ORGANIZATIONAL',
  ];

  columns: DataTableColumn<ClearingAgentApplicant>[] = [
    {
      header: 'Full Name',
      value: (a) =>
        [a.firstName, a.middleName, a.lastName].filter(Boolean).join(' '),
    },
    { header: 'Applicant Type', value: (a) => a.applicantType },
    { header: 'Training Program', value: (a) => a.trainingProgramTitle ?? '' },
    { header: 'Application No', value: (a) => a.applicationNumber ?? '' },
    { header: 'Request Status', value: (a) => a.userRequestStatus ?? '' },
  ];

  constructor(
    private applicantService: ClearingAgentApplicantService,
    private trainingService: TrainingService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadTrainingPrograms();
    this.loadApplicants();
  }

  private loadTrainingPrograms(): void {
    this.trainingService.getAllPrograms().subscribe({
      next: (list) => {
        const programs = list ?? [];
        // Admin can filter on any status; keep published first for usability
        const published = programs.filter((p) => p.status === TrainingStatus.PUBLISHED);
        const others = programs.filter((p) => p.status !== TrainingStatus.PUBLISHED);
        this.trainingPrograms = [...published, ...others];
      },
    });
  }

  loadApplicants(): void {
    this.loading = true;
    const request: ClearingAgentApplicantFilterRequest = this.buildFilterRequest();
    this.applicantService.filter(request).subscribe({
      next: (res: PageResponse<ClearingAgentApplicant>) => {
        this.applicants = res?.content ?? [];
        this.total = res?.totalElements ?? 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onPageChange(params: TableQueryParams): void {
    this.pageIndex = params.pageIndex;
    this.currentPage = this.pageIndex - 1;
    this.pageSize = params.pageSize;
    this.loadApplicants();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadApplicants();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedApplicantTypes = [];
    this.selectedTrainingProgramId = '';
    this.onFilterChange();
  }

  viewApplicant(a: ClearingAgentApplicant): void {
    if (!a.userRequestId) return;
    this.router.navigate(['/licenses/clearing-agent-applicants', a.userRequestId, 'detail']);
  }

  onRowClick(a: ClearingAgentApplicant): void {
    this.viewApplicant(a);
  }

  private buildFilterRequest(): ClearingAgentApplicantFilterRequest {
    return {
      searchText: this.searchText || undefined,
      trainingProgramId: this.selectedTrainingProgramId || undefined,
      applicantTypes:
        this.selectedApplicantTypes.length > 0 ? this.selectedApplicantTypes : undefined,
      sortBy: 'referenceNumber',
      sortDirection: 'DESC',
      page: this.currentPage,
      size: this.pageSize,
    };
  }
}

