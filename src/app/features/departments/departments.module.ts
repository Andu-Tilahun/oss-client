import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DepartmentsRoutingModule } from './departments-routing.module';
import { DepartmentListComponent } from './pages/department-list/department-list.component';
import { SharedModule } from '../../shared/shared.module';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { DepartmentCreateModalComponent } from './modals/department-create-modal/department-create-modal.component';
import { DepartmentEditModalComponent } from './modals/department-edit-modal/department-edit-modal.component';
import { ConfirmationModalComponent } from '../../shared/modals/confirmation-modal/confirmation-modal.component';
import { DepartmentFilterComponent } from './pages/department-filter/department-filter.component';

@NgModule({
  declarations: [DepartmentListComponent],
  imports: [
    CommonModule,
    DepartmentsRoutingModule,
    SharedModule,
    PageHeaderComponent,
    DepartmentCreateModalComponent,
    DepartmentEditModalComponent,
    ConfirmationModalComponent,
    DepartmentFilterComponent,
  ],
  exports: [DepartmentListComponent],
})
export class DepartmentsModule {}
