import {Component} from '@angular/core';
import {FarmLeaseCreateModalComponent} from '../../modals/farm-lease-create-modal/farm-lease-create-modal.component';
import {PageHeaderComponent} from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-farm-lease-list',
  standalone: false,
  templateUrl: './farm-lease-list.component.html',
  styleUrl: './farm-lease-list.component.css',
})
export class FarmLeaseListComponent {
  showCreateModal = false;

  onAddLease(): void {
    this.showCreateModal = true;
  }

  onLeaseCreated(): void {
    this.showCreateModal = false;
  }
}

