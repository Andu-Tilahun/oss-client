import { Component, OnInit, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PageHeaderComponent } from '../../../../../shared/components/page-header/page-header.component';
import {
  DynamicTab,
  UserRequestDetailComponent,
} from '../../../../../shared/user-request/pages/user-request-detail/user-request-detail.component';
import { ClearingAgentApplicantViewComponent } from '../../components/clearing-agent-applicant-view/clearing-agent-applicant-view.component';

@Component({
  selector: 'app-clearing-agent-applicant-detail',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, UserRequestDetailComponent, ClearingAgentApplicantViewComponent],
  templateUrl: './clearing-agent-applicant-detail.component.html',
  styleUrls: ['./clearing-agent-applicant-detail.component.css'],
})
export class ClearingAgentApplicantDetailComponent implements OnInit, AfterViewInit {
  userRequestId: string;
  loading = false;
  readonly userRequestType = 'NEW_CLEARING_AGENT_APPLICANT';

  @ViewChild('applicantTab') applicantTab!: TemplateRef<any>;

  dynamicTabs: DynamicTab[] = [];

  constructor(private route: ActivatedRoute) {
    this.userRequestId = this.route.snapshot.paramMap.get('id') || '';
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.dynamicTabs = [
      { key: 'applicant', label: 'Applicant', templateRef: this.applicantTab },
    ];
  }
}

