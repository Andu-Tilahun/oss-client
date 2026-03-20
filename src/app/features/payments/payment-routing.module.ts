import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PaymentListComponent } from './pages/payment-list/payment-list.component';
import { PaymentByOrderComponent } from './pages/payment-by-order/payment-by-order.component';
import { PaymentDetailComponent } from './pages/payment-detail/payment-detail.component';

const routes: Routes = [
  {
    path: '',
    component: PaymentListComponent
  },
  {
    path: 'by-order',
    component: PaymentByOrderComponent
  },
  {
    path: ':id',
    component: PaymentDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PaymentRoutingModule {
}
