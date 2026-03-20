import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotificationListComponent } from './pages/notification-list/notification-list.component';
import { NotificationDetailComponent } from './pages/notification-detail/notification-detail.component';

const routes: Routes = [
  {
    path: '',
    component: NotificationListComponent
  },
  {
    path: ':id',
    component: NotificationDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotificationRoutingModule {
}

