import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedRoutingModule } from './shared-routing.module';
import {DataTableComponent} from "./data-table/data-table.component";
import {ActionIconButtonComponent} from './components/action-icons/action-icon-button/action-icon-button.component';


@NgModule({
    declarations: [DataTableComponent],
    exports: [
        DataTableComponent
    ],
    imports: [
        CommonModule,
        ActionIconButtonComponent,
        SharedRoutingModule
    ]
})
export class SharedModule { }
