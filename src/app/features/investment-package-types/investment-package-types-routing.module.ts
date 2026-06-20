import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {InvestmentPackageTypeListComponent} from './pages/investment-package-type-list/investment-package-type-list.component';
import {InvestmentPackageTypePlotDetailComponent} from './pages/investment-package-type-plot-detail/investment-package-type-plot-detail.component';
import {InvestmentPackageType} from '../investment-package/models/investment-package.model';

function packageTypeRoutes(
  investmentPackageType: InvestmentPackageType,
  pageTitle: string,
): Routes {
  return [
    {
      path: '',
      component: InvestmentPackageTypeListComponent,
      data: {investmentPackageType, pageTitle},
    },
    {
      path: 'plot/:id',
      component: InvestmentPackageTypePlotDetailComponent,
      data: {investmentPackageType, pageTitle, detailMode: 'plot'},
    },
    {
      path: 'package/:id',
      component: InvestmentPackageTypePlotDetailComponent,
      data: {investmentPackageType, pageTitle, detailMode: 'lease'},
    },
  ];
}

const routes: Routes = [
  {
    path: '',
    redirectTo: 'leasing',
    pathMatch: 'full',
  },
  {
    path: 'leasing',
    children: packageTypeRoutes('LEASING', 'Leasing Investment Packages'),
  },
  {
    path: 'bidding',
    children: packageTypeRoutes('BIDDING', 'Bidding Investment Packages'),
  },
  {
    path: 'crowdfunding',
    children: packageTypeRoutes('CROWDFUNDING', 'Crowdfunding Investment Packages'),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InvestmentPackageTypesRoutingModule {}
