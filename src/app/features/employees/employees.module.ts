import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmployeeListComponent } from './pages/employee-list/employee-list.component';
import { SharedModule } from '../../shared/shared.module';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmployeeCreateModalComponent } from './modals/employee-create-modal/employee-create-modal.component';
import { EmployeeEditModalComponent } from './modals/employee-edit-modal/employee-edit-modal.component';
import { EmployeeFilterComponent } from './pages/employee-filter/employee-filter.component';
import { EmployeesRoutingModule } from './employees-routing.module';
import { EmployeeDetailComponent } from './pages/employee-detail/employee-detail.component';
import { BorrowCreateModalComponent } from '../borrow-records/modals/borrow-create-modal/borrow-create-modal.component';
import { BorrowRecordsModule } from '../borrow-records/borrow-records.module';
import { EmployeeViewComponent } from './components/employee-view/employee-view.component';

@NgModule({
  declarations: [EmployeeListComponent, EmployeeDetailComponent],
  imports: [
    CommonModule,
    EmployeesRoutingModule,
    SharedModule,
    PageHeaderComponent,
    EmployeeCreateModalComponent,
    EmployeeEditModalComponent,
    EmployeeFilterComponent,
    BorrowCreateModalComponent,
    BorrowRecordsModule,
    EmployeeViewComponent,
  ],
  exports: [EmployeeListComponent, EmployeeDetailComponent],
})
export class EmployeesModule {}
