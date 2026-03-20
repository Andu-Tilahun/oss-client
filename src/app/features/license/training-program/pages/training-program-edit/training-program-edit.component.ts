import {AfterViewInit, Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {
  TrainingProgramEditModalComponent
} from '../../modals/training-program-edit-modal/training-program-edit-modal.component';
import {PageHeaderComponent} from "../../../../../shared/components/page-header/page-header.component";
import {
  DynamicTab,
  UserRequestDetailComponent,
} from "../../../../../shared/user-request/pages/user-request-detail/user-request-detail.component";
import {TrainingProgramViewComponent} from '../../components/training-program-view/training-program-view.component';

@Component({
  selector: 'app-training-program-edit',
  standalone: true,
  imports: [
    CommonModule,
    TrainingProgramEditModalComponent,
    PageHeaderComponent,
    UserRequestDetailComponent,
    TrainingProgramViewComponent
  ],
  templateUrl: './training-program-edit.component.html',
  styleUrls: ['./training-program-edit.component.css']
})
export class TrainingProgramEditComponent implements OnInit, AfterViewInit {
  userRequestId: string;
  loading = false;
  readonly userRequestType = 'NEW_TRAINING_PROGRAM';

  @ViewChild('trainingProgramTab') trainingProgramTab!: TemplateRef<any>;

  dynamicTabs: DynamicTab[] = [];

  constructor(private route: ActivatedRoute) {
    this.userRequestId = this.route.snapshot.paramMap.get('id') || '';
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.dynamicTabs = [
      {key: 'applicant', label: 'Applicant', templateRef: this.trainingProgramTab},
    ];
  }
}

