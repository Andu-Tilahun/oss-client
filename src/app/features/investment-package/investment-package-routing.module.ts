import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {InvestmentPackageListComponent} from './pages/investment-package-list/investment-package-list.component';
import {InvestmentPackageInvestmentListComponent} from './pages/investment-package-investment-list/investment-package-investment-list.component';

const routes: Routes = [

  {
    path: '',
    component: InvestmentPackageListComponent,
  },
  {
    path: 'investments',
    component: InvestmentPackageInvestmentListComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InvestmentPackageRoutingModule {}

