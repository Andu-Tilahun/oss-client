import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BranchesRoutingModule} from './branches-routing.module';
import {BranchListComponent} from './pages/branch-list/branch-list.component';
import {SharedModule} from '../../shared/shared.module';
import {PageHeaderComponent} from '../../shared/components/page-header/page-header.component';
import {ConfirmationModalComponent} from '../../shared/modals/confirmation-modal/confirmation-modal.component';
import {BranchCreateModalComponent} from './modals/branch-create-modal/branch-create-modal.component';
import {BranchEditModalComponent} from './modals/branch-edit-modal/branch-edit-modal.component';
import {BranchFilterComponent} from './pages/branch-filter/branch-filter.component';

@NgModule({
  declarations: [BranchListComponent],
  imports: [
    CommonModule,
    BranchesRoutingModule,
    SharedModule,
    PageHeaderComponent,
    BranchCreateModalComponent,
    BranchEditModalComponent,
    BranchFilterComponent,
    ConfirmationModalComponent
  ]
})
export class BranchesModule {
}

