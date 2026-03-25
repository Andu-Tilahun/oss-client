import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {FarmCrowdfundingCampaignListComponent} from './pages/farm-crowdfunding-campaign-list/farm-crowdfunding-campaign-list.component';
import {FarmCrowdfundingInvestmentListComponent} from './pages/farm-crowdfunding-investment-list/farm-crowdfunding-investment-list.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'campaigns',
    pathMatch: 'full',
  },
  {
    path: 'campaigns',
    component: FarmCrowdfundingCampaignListComponent,
  },
  {
    path: 'investments',
    component: FarmCrowdfundingInvestmentListComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FarmCrowdfundingRoutingModule {}

