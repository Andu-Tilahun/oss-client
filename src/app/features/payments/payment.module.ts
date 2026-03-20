import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentRoutingModule } from './payment-routing.module';
import { SharedModule } from '../../shared/shared.module';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PaymentListComponent } from './pages/payment-list/payment-list.component';
import { PaymentByOrderComponent } from './pages/payment-by-order/payment-by-order.component';
import { PaymentFilterComponent } from './pages/payment-filter/payment-filter.component';

@NgModule({
  declarations: [PaymentListComponent, PaymentByOrderComponent],
  imports: [
    CommonModule,
    FormsModule,
    PaymentRoutingModule,
    SharedModule,
    PageHeaderComponent,
    PaymentFilterComponent
  ]
})
export class PaymentModule {
}
