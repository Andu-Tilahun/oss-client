import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {OrganizationsRoutingModule} from './organizations-routing.module';
import {OrganizationListComponent} from './pages/organization-list/organization-list.component';
import {SharedModule} from '../../shared/shared.module';
import {PageHeaderComponent} from '../../shared/components/page-header/page-header.component';
import {OrganizationCreateModalComponent} from './modals/organization-create-modal/organization-create-modal.component';
import {OrganizationEditModalComponent} from './modals/organization-edit-modal/organization-edit-modal.component';
import {ConfirmationModalComponent} from '../../shared/modals/confirmation-modal/confirmation-modal.component';
import {OrganizationFilterComponent} from './pages/organization-filter/organization-filter.component';

@NgModule({
  declarations: [OrganizationListComponent],
  imports: [
    CommonModule,
    OrganizationsRoutingModule,
    SharedModule,
    PageHeaderComponent,
    OrganizationCreateModalComponent,
    OrganizationEditModalComponent,
    ConfirmationModalComponent,
    OrganizationFilterComponent
  ]
})
export class OrganizationsModule {
}

