import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CrowdFundingListComponent} from './pages/crowd-funding-list/crowd-funding-list.component';
import {CrowdFundingInvestmentListComponent} from './pages/crowd-funding-investment-list/crowd-funding-investment-list.component';

const routes: Routes = [

  {
    path: '',
    component: CrowdFundingListComponent,
  },
  {
    path: 'investments',
    component: CrowdFundingInvestmentListComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CrowdFundingRoutingModule {}

