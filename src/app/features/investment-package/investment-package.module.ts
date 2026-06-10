import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SharedModule} from '../../shared/shared.module';
import {PageSplitLayoutComponent} from '../../shared/components/page-split-layout/page-split-layout/page-split-layout.component';
import {InvestmentPackageRoutingModule} from './investment-package-routing.module';
import {InvestmentPackageListComponent} from './pages/investment-package-list/investment-package-list.component';
import {InvestmentPackageViewComponent} from './components/investment-package-view/investment-package-view.component';
import {InvestmentPackageCreateModalComponent} from './modals/investment-package-create-modal/investment-package-create-modal.component';
import {InvestmentPackageEditModalComponent} from './modals/investment-package-edit-modal/investment-package-edit-modal.component';
import {InvestmentPackageCreateInvestmentModalComponent} from './modals/investment-package-create-investment-modal/investment-package-create-investment-modal.component';
import {InvestmentPackageInvestmentListComponent} from './pages/investment-package-investment-list/investment-package-investment-list.component';
import {InvestmentPackageInvestmentViewComponent} from './components/investment-package-investment-view/investment-package-investment-view.component';
import {InvestmentPackageSetRoiModalComponent} from './modals/investment-package-set-roi-modal/investment-package-set-roi-modal.component';
import {InvestmentPackageInvestorDecisionModalComponent} from './modals/investment-package-investor-decision-modal/investment-package-investor-decision-modal.component';
import {InvestmentPackageFilterComponent} from './pages/investment-package-filter/investment-package-filter.component';
import {InvestmentPackageInvestmentFilterComponent} from './pages/investment-package-investment-filter/investment-package-investment-filter.component';
import {ConfirmationModalComponent} from "../../shared/modals/confirmation-modal/confirmation-modal.component";
import {TabsComponent} from "../../shared/tabs/app-tabs/app-tabs.component";
import {FarmPlotViewComponent} from "../farm-plots/components/farm-plot-view/farm-plot-view.component";
import {FarmFollowupsModule} from "../farm-followups/farm-followups.module";
import {UserViewComponent} from "../users/components/user-view/user-view.component";

@NgModule({
  declarations: [
    InvestmentPackageListComponent,
    InvestmentPackageInvestmentListComponent,
  ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        InvestmentPackageRoutingModule,
        SharedModule,
        PageSplitLayoutComponent,
        InvestmentPackageFilterComponent,
        InvestmentPackageInvestmentFilterComponent,
        InvestmentPackageViewComponent,
        InvestmentPackageInvestmentViewComponent,
        InvestmentPackageCreateModalComponent,
        InvestmentPackageEditModalComponent,
        InvestmentPackageCreateInvestmentModalComponent,
        InvestmentPackageSetRoiModalComponent,
        InvestmentPackageInvestorDecisionModalComponent,
        ConfirmationModalComponent,
        TabsComponent,
        FarmPlotViewComponent,
        FarmFollowupsModule,
        UserViewComponent,
    ],
})
export class InvestmentPackageModule {}

