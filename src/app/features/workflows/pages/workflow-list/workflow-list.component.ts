import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {ConfirmationModalComponent} from "../../../../shared/modals/confirmation-modal/confirmation-modal.component";
import {InfoModalComponent} from "../../../../shared/modals/info-modal/info-modal.component";
import {SharedModule} from "../../../../shared/shared.module";
import {DataTableColumn} from "../../../../shared/data-table/models/data-table-column.model";
import {UserRequestType, Workflow} from "../../models/workflow.model";
import {WorkflowService} from "../../services/workflow.service";
import {TableQueryParams} from "../../../../shared/data-table/models/table-query-params.model";
import {WorkflowFilterComponent} from "../workflow-filter/workflow-filter.component";
import {WorkflowFilterRequest} from "../workflow-filter/workflow-filter-request";
import {PageResponse} from "../../../../shared/models/api-response.model";
import {WorkflowCreateModalComponent} from "../../modals/workflow-create-modal/workflow-create-modal.component";
import {WorkflowEditModalComponent} from "../../modals/workflow-edit-modal/workflow-edit-modal.component";
import {PageHeaderComponent} from "../../../../shared/components/page-header/page-header.component";

@Component({
  selector: 'app-workflow-list',
  standalone: true,
    imports: [
        CommonModule,
        ConfirmationModalComponent,
        InfoModalComponent,
        SharedModule,
        WorkflowFilterComponent,
        WorkflowCreateModalComponent,
        WorkflowEditModalComponent,
        PageHeaderComponent
    ],
  templateUrl: './workflow-list.component.html'
})
export class WorkflowListComponent implements OnInit {
  columns: DataTableColumn<Workflow>[] = [
    {
      header: 'Name',
      value: (workflow) => workflow.name
    },
    {
      header: 'Request Type',
      value: (workflow) => workflow.requestType
    },
    {
      header: 'Transitions',
      value: (workflow) => workflow.workflowTransitions?.length || 0
    },
    {
      header: 'Created Date',
      value: (workflow) => workflow.createdDate ? new Date(workflow.createdDate).toLocaleDateString() : '-'
    }
  ];

  workflows: Workflow[] = [];
  loading = false;
  total = 0;
  pageSize = 10;
  pageIndex = 1;
  currentPage = 0;

  // Filters
  searchText = '';
  selectedRequestTypes: UserRequestType[] = [];

  showDeleteModal = false;
  deleteLoading = false;
  selectedWorkflow: Workflow | null = null;

  showCreateModal = false;
  showEditModal = false;

  showSuccessModal = false;
  successMessage = '';

  constructor(
    private workflowService: WorkflowService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadWorkflows();
  }

  loadWorkflows() {
    this.loading = true;
    const filterRequest: WorkflowFilterRequest = {
      searchText: this.searchText || undefined,
      requestTypes: this.selectedRequestTypes.length ? this.selectedRequestTypes : undefined,
      sortBy: 'name',
      sortDirection: 'ASC',
      page: this.currentPage,
      size: this.pageSize
    };

    this.workflowService.filterWorkflows(filterRequest).subscribe({
      next: (response: PageResponse<Workflow>) => {
        this.workflows = response.content;
        this.total = response.totalElements;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading workflows:', error);
        this.loading = false;
      }
    });
  }

  onPageChange(params: TableQueryParams) {
    this.pageIndex = params.pageIndex;
    this.currentPage = this.pageIndex - 1;
    this.pageSize = params.pageSize;
    this.loadWorkflows();
  }

  onAdd() {
    this.showCreateModal = true;
  }

  onRefresh() {
    this.loadWorkflows();
  }

  onSearch() {
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadWorkflows();
  }

  clearFilters() {
    this.searchText = '';
    this.selectedRequestTypes = [];
    this.currentPage = 0;
    this.pageIndex = 1;
    this.loadWorkflows();
  }

  onView(workflow: Workflow) {
    if (workflow?.id) {
      this.router.navigate(['/workflows', workflow.id]);
    }
  }

  onEdit(workflow: Workflow) {
    this.selectedWorkflow = workflow;
    this.showEditModal = true;
  }

  onDeleteClick(workflow: Workflow) {
    this.selectedWorkflow = workflow;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (!this.selectedWorkflow?.id) return;

    this.deleteLoading = true;
    this.workflowService.delete(this.selectedWorkflow.id).subscribe({
      next: () => {
        this.deleteLoading = false;
        this.showDeleteModal = false;
        this.successMessage = 'Workflow deleted successfully!';
        this.showSuccessModal = true;
        this.loadWorkflows();
      },
      error: (error) => {
        console.error('Error deleting workflow:', error);
        this.deleteLoading = false;
      }
    });
  }
}
