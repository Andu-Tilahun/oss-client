import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedRoutingModule } from './shared-routing.module';
import {DataTableComponent} from "./data-table/data-table.component";
import {ActionIconButtonComponent} from './components/action-icons/action-icon-button/action-icon-button.component';
import { DataCardLayoutComponent } from './data-card-layout/data-card-layout.component';
import {
  CardBodyTemplateDirective,
  CardFooterTemplateDirective
} from './data-card-layout/data-card-layout-templates.directive';
import { CardItemLayoutComponent } from './card-item-layout/card-item-layout.component';


@NgModule({
    declarations: [
        DataTableComponent,
        DataCardLayoutComponent,
        CardItemLayoutComponent,
        CardBodyTemplateDirective,
        CardFooterTemplateDirective
    ],
    exports: [
        DataTableComponent,
        DataCardLayoutComponent,
        CardItemLayoutComponent,
        CardBodyTemplateDirective,
        CardFooterTemplateDirective
    ],
    imports: [
        CommonModule,
        ActionIconButtonComponent,
        SharedRoutingModule
    ]
})
export class SharedModule { }
