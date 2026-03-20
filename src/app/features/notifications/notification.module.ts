import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationRoutingModule } from './notification-routing.module';
import { NotificationListComponent } from './pages/notification-list/notification-list.component';
import { NotificationFilterComponent } from './pages/notification-filter/notification-filter.component';
import { SharedModule } from '../../shared/shared.module';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@NgModule({
  declarations: [NotificationListComponent],
  imports: [
    CommonModule,
    SharedModule,
    NotificationRoutingModule,
    PageHeaderComponent,
    NotificationFilterComponent
  ]
})
export class NotificationModule {
}

