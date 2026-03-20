import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {TrainingService} from '../../services/training.service';
import {TrainingProgram, TrainingProgramFilterRequest, TrainingStatus} from '../../models/training.model';
import {DataTableColumn} from "../../../../../shared/data-table/models/data-table-column.model";
import {PageResponse} from "../../../../../shared/models/api-response.model";
import {TableQueryParams} from "../../../../../shared/data-table/models/table-query-params.model";
import {UserRequestType} from "../../../../workflows/models/workflow.model";
import {UserRequest} from "../../../../../shared/user-request/models/user-request.model";
import {ClearingAgentApplicant} from "../../../clearing-agent-applicant/models/clearing-agent-applicant.model";

@Component({
  selector: 'app-training-program-list',
  standalone: false,
  templateUrl: './training-program-list.component.html'
})
export class TrainingProgramListComponent implements OnInit {
  programs: TrainingProgram[] = [];
  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  currentPage = 0;
  showCreateModal = false;
  requestTye: UserRequestType = UserRequestType.NEW_TRAINING_PROGRAM;

  // Filters
  searchText = '';
  selectedStatuses: TrainingStatus[] = [];

  // columns: DataTableColumn<TrainingProgram>[] = [
  //   {header: 'Title', value: (p) => p.title},
  //   {
  //     header: 'Status',
  //     value: (p) => p.status
  //   },
  //   {
  //     header: 'Registration',
  //     value: (p) => `${p.registrationStartDate} - ${p.registrationEndDate}`
  //   },
  //   {
  //     header: 'Training',
  //     value: (p) => `${p.trainingStartDate} - ${p.trainingEndDate}`
  //   }
  // ];

  columns: DataTableColumn<TrainingProgram>[] = [
    { header: 'Training Program', value: (a) => a.title ?? '' },
    { header: 'Application No', value: (a) => a.applicationNumber ?? '' },
    { header: 'Request Status', value: (a) => a.userRequestStatus ?? '' },
  ];

  trainingStatuses = Object.values(TrainingStatus);

  constructor(
    private trainingService: TrainingService,
    private router: Router
  ) {
  }

  ngOnInit() {
    this.loadPrograms();
  }

  loadPrograms() {
    this.loading = true;
    const request: TrainingProgramFilterRequest = this.buildFilterRequest();
    this.trainingService.filterPrograms(request).subscribe({
      next: (response: PageResponse<TrainingProgram>) => {
        if (response) {
          this.programs = response.content;
          this.total = response.totalElements;
        }
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  createProgram() {
    this.showCreateModal = true;
  }

  // viewProgram(program: TrainingProgram) {
  //   this.router.navigate(['/licenses', program.id, 'edit']);
  // }

  viewProgram(trainingProgram: TrainingProgram) {
    this.router.navigate(['/licenses', trainingProgram.userRequestId, 'edit']);
  }

  onPageChange(params: TableQueryParams) {
    this.pageIndex = params.pageIndex;
    this.currentPage = this.pageIndex - 1;
    this.pageSize = params.pageSize;
    this.loadPrograms();
  }

  onSearch(): void {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadPrograms();
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadPrograms();
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedStatuses = [];
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadPrograms();
  }

  private buildFilterRequest(): TrainingProgramFilterRequest {
    return {
      searchText: this.searchText || undefined,
      statuses: this.selectedStatuses && this.selectedStatuses.length ? this.selectedStatuses : undefined,
      sortBy: 'title',
      sortDirection: 'ASC',
      page: this.currentPage,
      size: this.pageSize
    };
  }

  onProgramCreated(): void {
    this.loadPrograms();
  }
}
