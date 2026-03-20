import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {UserRoutingModule} from './user-routing.module';
import {UserDetailComponent} from "./pages/user-detail/user-detail.component";
import {UserListComponent} from "./pages/user-list/user-list.component";
import {SharedModule} from "../../shared/shared.module";
import {PageHeaderComponent} from "../../shared/components/page-header/page-header.component";
import {UserCreateModalComponent} from "./modals/user-create-modal/user-create-modal.component";
import {UserEditModalComponent} from "./modals/user-edit-modal/user-edit-modal.component";
import {ConfirmationModalComponent} from "../../shared/modals/confirmation-modal/confirmation-modal.component";
import {FormsModule} from "@angular/forms";
import {UserFilterComponent} from "./pages/user-filter/user-filter.component";
import {DetailCardComponent} from "../../shared/components/detail-field/detail-card/detail-card.component";
import {DetailSectionComponent} from "../../shared/components/detail-field/detail-section/detail-section.component";
import {DetailFieldComponent} from "../../shared/components/detail-field/detail-field/detail-field.component";

@NgModule({
  declarations: [UserDetailComponent, UserListComponent],
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    UserRoutingModule,
    PageHeaderComponent,
    UserCreateModalComponent,
    UserEditModalComponent,
    ConfirmationModalComponent,
    UserFilterComponent,
    DetailCardComponent,
    DetailSectionComponent,
    DetailFieldComponent
  ]
})
export class UserModule {
}
