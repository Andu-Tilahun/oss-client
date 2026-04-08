import {Component} from '@angular/core';
import {FarmFollowUp} from '../../models/farm-followup.model';
import {DataTableColumn} from '../../../../shared/data-table/models/data-table-column.model';
import {ToastService} from '../../../../shared/toast/toast.service';
import {FarmFollowUpService} from '../../services/farm-followup.service';
import {TableQueryParams} from '../../../../shared/data-table/models/table-query-params.model';

@Component({
  selector: 'app-farm-followups-page',
  standalone: false,
  templateUrl: './farm-followups-page.component.html',
  styleUrl: './farm-followups-page.component.css',
})
export class FarmFollowupsPageComponent {
  followUps: FarmFollowUp[] = [];
  loading = false;

  externalId = '';

  selectedFollowUp: FarmFollowUp | null = null;
  detailRefreshKey = 0;

  showCreateModal = false;
  showViewModal = false;

  columns: DataTableColumn<FarmFollowUp>[] = [
    {header: 'Remark', value: (x) => x.remark},
    {header: 'Attachment', value: (x) => x.attachment ?? ''},
    {header: 'Created At', value: (x) => x.createdAt ?? ''},
    {header: 'Created By', value: (x) => x.createdBy ?? ''},
  ];

  constructor(
    private farmFollowUpService: FarmFollowUpService,
    private toastService: ToastService,
  ) {}

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
      this.selectedFollowUp = null;
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
    this.detailRefreshKey++;
  }

  openViewModal(item: FarmFollowUp): void {
    this.selectedFollowUp = {...item};
    this.showViewModal = true;
  }

  onPageChange(_params: TableQueryParams): void {
    // Follow-ups are loaded by externalId and returned as a list.
    // Keep pagination disabled for now to match the backend shape.
  }

  private loadFollowUps(externalId: string): void {
    this.loading = true;
    this.farmFollowUpService.getByExternalId(externalId).subscribe({
      next: (data) => {
        this.followUps = data ?? [];
        this.loading = false;

        // default selection like farm-plots: pick first if none selected
        if (!this.selectedFollowUp && this.followUps.length > 0) {
          this.selectedFollowUp = {...this.followUps[0]};
          this.detailRefreshKey++;
        }
      },
      error: (error) => {
        this.loading = false;
        this.toastService.error(error.message || 'Failed to retrieve follow-ups', 'Follow Ups');
      }
    });
  }

  onFollowUpCreated(): void {
    this.showCreateModal = false;
    this.onRefresh();
  }

  onCloseDetail(): void {
    this.selectedFollowUp = null;
  }
}

