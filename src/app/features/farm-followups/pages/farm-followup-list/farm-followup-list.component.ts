import {Component, Input} from '@angular/core';
import {FarmFollowUp} from '../../models/farm-followup.model';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {FarmFollowUpService} from '../../services/farm-followup.service';
import {AuthService} from "../../../auth/services/auth.service";

@Component({
  selector: 'app-farm-followup-list',
  standalone: false,
  templateUrl: './farm-followup-list.component.html',
  styleUrl: './farm-followup-list.component.css',
})
export class FarmFollowUpListComponent {
  @Input() followUps: FarmFollowUp[] = [];
  loading = false;
  @Input() externalId = '';

  showCreateButton = false;
  showEditButton = false;
  showViewButton = true;

  showCreateModal = false;
  showViewModal = false;
  selectedFollowUp: FarmFollowUp | null = null;

  columns: DataTableColumn<FarmFollowUp>[] = [
    {header: 'Remark', value: (x) => x.remark},
    {header: 'Attachment', value: (x) => x.attachment ?? ''},
    {header: 'Created At', value: (x) => x.createdAt ?? ''},
    {header: 'Created By', value: (x) => x.createdBy ?? ''},
  ];

  constructor(
    private farmFollowUpService: FarmFollowUpService,
    private authService: AuthService,
    private toastService: ToastService,
  ) {
    this.showCreateButton = this.authService.isExtensionWorker();
    this.showEditButton = this.authService.isExtensionWorker();
  }

  onSearch(): void {
    const id = (this.externalId ?? '').trim();
    if (!id) {
      this.toastService.warning('Please enter External Id', 'Follow Ups');
      return;
    }
    this.loadFollowUps(id);
  }

  onRefresh(): void {
    const id = (this.externalId ?? '').trim();
    if (!id) {
      this.followUps = [];
      return;
    }
    this.loadFollowUps(id);
  }

  onAdd(): void {
    const id = (this.externalId ?? '').trim();
    if (!id) {
      this.toastService.warning('Enter External Id first', 'Create Follow Up');
      return;
    }
    this.showCreateModal = true;
  }

  onView(item: FarmFollowUp): void {
    this.selectedFollowUp = {...item};
    this.showViewModal = true;
  }

  onEdit(_item: FarmFollowUp): void {
    this.toastService.warning('Edit follow-up is not implemented', 'Follow Ups');
  }

  private loadFollowUps(externalId: string): void {
    this.loading = true;
    this.farmFollowUpService.getByExternalId(externalId).subscribe({
      next: (data) => {
        this.followUps = data ?? [];
        this.loading = false;
        // this.toastService.success('Follow-ups retrieved successfully');
      },
      error: (error) => {
        this.loading = false;
        // this.toastService.error(error.message || 'Failed to retrieve follow-ups', 'Follow Ups');
      }
    });
  }

  onFollowUpCreated(): void {
    this.showCreateModal = false;
    this.onRefresh();
  }
}

