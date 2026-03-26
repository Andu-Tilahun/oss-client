import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SharedModule} from '../../shared/shared.module';
import {PageSplitLayoutComponent} from '../../shared/components/page-split-layout/page-split-layout/page-split-layout.component';
import {FarmCrowdfundingRoutingModule} from './farm-crowdfunding-routing.module';
import {FarmCrowdfundingCampaignListComponent} from './pages/farm-crowdfunding-campaign-list/farm-crowdfunding-campaign-list.component';
import {FarmCrowdfundingCampaignViewComponent} from './components/farm-crowdfunding-campaign-view/farm-crowdfunding-campaign-view.component';
import {FarmCrowdfundingCreateCampaignModalComponent} from './modals/farm-crowdfunding-create-campaign-modal/farm-crowdfunding-create-campaign-modal.component';
import {FarmCrowdfundingCreateInvestmentModalComponent} from './modals/farm-crowdfunding-create-investment-modal/farm-crowdfunding-create-investment-modal.component';
import {FarmCrowdfundingInvestmentListComponent} from './pages/farm-crowdfunding-investment-list/farm-crowdfunding-investment-list.component';
import {FarmCrowdfundingInvestmentViewComponent} from './components/farm-crowdfunding-investment-view/farm-crowdfunding-investment-view.component';
import {FarmCrowdfundingSetRoiModalComponent} from './modals/farm-crowdfunding-set-roi-modal/farm-crowdfunding-set-roi-modal.component';
import {FarmCrowdfundingInvestorDecisionModalComponent} from './modals/farm-crowdfunding-investor-decision-modal/farm-crowdfunding-investor-decision-modal.component';
import {FarmCrowdfundingCampaignFilterComponent} from './pages/farm-crowdfunding-campaign-filter/farm-crowdfunding-campaign-filter.component';
import {FarmCrowdfundingInvestmentFilterComponent} from './pages/farm-crowdfunding-investment-filter/farm-crowdfunding-investment-filter.component';

@NgModule({
  declarations: [
    FarmCrowdfundingCampaignListComponent,
    FarmCrowdfundingInvestmentListComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FarmCrowdfundingRoutingModule,
    SharedModule,
    PageSplitLayoutComponent,
    FarmCrowdfundingCampaignFilterComponent,
    FarmCrowdfundingInvestmentFilterComponent,
    FarmCrowdfundingCampaignViewComponent,
    FarmCrowdfundingInvestmentViewComponent,
    FarmCrowdfundingCreateCampaignModalComponent,
    FarmCrowdfundingCreateInvestmentModalComponent,
    FarmCrowdfundingSetRoiModalComponent,
    FarmCrowdfundingInvestorDecisionModalComponent,
  ],
})
export class FarmCrowdfundingModule {}

