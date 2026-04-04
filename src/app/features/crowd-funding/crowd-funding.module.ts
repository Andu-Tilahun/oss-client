import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SharedModule} from '../../shared/shared.module';
import {PageSplitLayoutComponent} from '../../shared/components/page-split-layout/page-split-layout/page-split-layout.component';
import {CrowdFundingRoutingModule} from './crowd-funding-routing.module';
import {CrowdFundingListComponent} from './pages/crowd-funding-list/crowd-funding-list.component';
import {CrowdFundingViewComponent} from './components/crowd-funding-view/crowd-funding-view.component';
import {CrowdFundingCreateModalComponent} from './modals/crowd-funding-create-modal/crowd-funding-create-modal.component';
import {CrowdFundingCreateInvestmentModalComponent} from './modals/crowd-funding-create-investment-modal/crowd-funding-create-investment-modal.component';
import {FarmCrowdfundingInvestmentListComponent} from './pages/farm-crowdfunding-investment-list/farm-crowdfunding-investment-list.component';
import {CrowdFundingInvestmentViewComponent} from './components/crowd-funding-investment-view/crowd-funding-investment-view.component';
import {CrowdFundingSetRoiModalComponent} from './modals/crowd-funding-set-roi-modal/crowd-funding-set-roi-modal.component';
import {CrowdFundingInvestorDecisionModalComponent} from './modals/crowd-funding-investor-decision-modal/crowd-funding-investor-decision-modal.component';
import {CrowdFundingFilterComponent} from './pages/crowd-funding-filter/crowd-funding-filter.component';
import {CrowdFundingInvestmentFilterComponent} from './pages/crowd-funding-investment-filter/crowd-funding-investment-filter.component';

@NgModule({
  declarations: [
    CrowdFundingListComponent,
    FarmCrowdfundingInvestmentListComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CrowdFundingRoutingModule,
    SharedModule,
    PageSplitLayoutComponent,
    CrowdFundingFilterComponent,
    CrowdFundingInvestmentFilterComponent,
    CrowdFundingViewComponent,
    CrowdFundingInvestmentViewComponent,
    CrowdFundingCreateModalComponent,
    CrowdFundingCreateInvestmentModalComponent,
    CrowdFundingSetRoiModalComponent,
    CrowdFundingInvestorDecisionModalComponent,
  ],
})
export class CrowdFundingModule {}

