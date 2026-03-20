import { Component, ContentChild, ContentChildren, HostListener, Input, OnChanges, SimpleChanges, TemplateRef, QueryList, AfterContentInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsComponent } from '../../../tabs/app-tabs/app-tabs.component';
import { TabItem } from '../../../tabs/models/tab-item.model';
import { StatCardComponent } from '../../../stat-card/stat-card/stat-card.component';
import { CardLayoutComponent } from '../../../card-layout/card-layout.component';
import { CardFooterDirective } from '../../../card-layout/card-footer.directive';
import { ModalComponent } from '../../../modals/modal/modal.component';
import { DocumentUploadComponent } from '../../../file-upload/document-upload/document-upload.component';
import { UserProfilePictureComponent } from '../../../components/user-profile-picture/user-profile-picture.component';
import { UserRequestProcessModalComponent } from '../user-request-process-modal/user-request-process-modal.component';
import { UserRequestAssignModalComponent } from '../user-request-assign-modal/user-request-assign-modal.component';
import { FileUploadService } from '../../../file-upload/file-upload.service';

import { EditUserRequestCommand, UserRequest, UserRequestStatusLog, WorkflowTransition } from '../../models/user-request.model';
import { UserRequestService } from '../../services/user-request.service';
import { ApiResponse } from '../../../models/api-response.model';

export interface DynamicTab {
  key: string;
  label: string;
  templateRef: TemplateRef<any>;
}

@Component({
  selector: 'app-user-request-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TabsComponent,
    StatCardComponent,
    CardLayoutComponent,
    CardFooterDirective,
    ModalComponent,
    DocumentUploadComponent,
    UserProfilePictureComponent,
    UserRequestProcessModalComponent,
    UserRequestAssignModalComponent
  ],
  templateUrl: './user-request-detail.component.html',
  styleUrls: ['./user-request-detail.component.css']
})
export class UserRequestDetailComponent implements OnChanges, AfterContentInit {
  @Input() userRequestId = '';
  @Input() requestType = '';


  /**
   * Dynamic tabs configuration from parent.
   * Each tab must have a unique key, label, and templateRef.
   * Example: [{ key: 'documents', label: 'Documents', templateRef: documentsTemplate }]
   */
  @Input() dynamicTabs: DynamicTab[] = [];

  @ContentChild('mainContent') mainContentTpl?: TemplateRef<unknown>;

  /**
   * Legacy support for single training program tab via content projection
   */
  @ContentChild('tabTrainingProgram', { read: TemplateRef })
  trainingProgramTabTpl?: TemplateRef<any>;

  /**
   * Support for multiple dynamic tabs via content projection with custom selectors
   * Parent can provide multiple templates with different selectors
   */
  @ContentChildren('dynamicTab', { read: TemplateRef })
  dynamicTabTemplates!: QueryList<TemplateRef<any>>;

  loading = false;
  processing = false;

  userRequest?: UserRequest;
  transitions: WorkflowTransition[] = [];

  activeTab = 'request';

  /**
   * Build tabs array by combining:
   * - Request tab (always first)
   * - Dynamic tabs from @Input() dynamicTabs
   * - Legacy training program tab (if showTrainingProgramTab is true)
   * - History tab (always last)
   */
  get tabs(): TabItem[] {
    const base: TabItem[] = [
      { key: 'request', label: 'Request' },
    ];

    // Add dynamic tabs from input
    if (this.dynamicTabs && this.dynamicTabs.length) {
      this.dynamicTabs.forEach(tab => {
        base.push({ key: tab.key, label: tab.label });
      });
    }


    // Add history tab last
    base.push({ key: 'history', label: 'History' });

    return base;
  }

  showActionsDropdown = false;

  // process modal
  showProcessModal = false;
  selectedTransition?: WorkflowTransition;
  remark = '';
  attachmentId: string | null = null;

  // assign modal
  showAssignModal = false;
  assignSelectedUserId: string | number | null = null;
  assignRemark = '';
  assignAttachmentId: string | null = null;

  constructor(
    private userRequestService: UserRequestService,
    private fileUploadService: FileUploadService,
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['userRequestId']) {
      this.load();
    }
  }

  ngAfterContentInit(): void {
    // If parent provides dynamic tabs through content projection with @ContentChildren('dynamicTab')
    // we could map them here, but we'll rely on the @Input() dynamicTabs approach for clarity
  }

  load(): void {
    if (!this.userRequestId) return;
    this.loading = true;
    this.userRequestService.getById(this.userRequestId).subscribe({
      next: (res: UserRequest) => {
        this.userRequest = res;
        this.loading = false;
        this.loadTransitions();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private loadTransitions(): void {
    if (!this.requestType) return;
    if (!this.userRequest?.status) return;

    this.userRequestService.getTransitions(this.requestType, this.userRequest.status).subscribe({
      next: (res) => {
        this.transitions = res?.workflowTransitions ?? [];
      },
      error: () => {
        this.transitions = [];
      }
    });
  }

  hasTransitionAction(action: string): boolean {
    return this.transitions.some(t => t.action === action);
  }

  hasAnyTransitionAction(): boolean {
    return this.transitions.some(t => !!t.action);
  }

  get history(): UserRequestStatusLog[] {
    const items = this.userRequest?.userRequestStatusLogList ?? [];
    return [...items].sort((a, b) => {
      const t1 = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const t2 = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return t2 - t1;
    });
  }


  getDynamicTabTemplate(key: string): TemplateRef<any> | null {
    const tab = this.dynamicTabs.find(t => t.key === key);
    return tab?.templateRef || null;
  }



  openProcessModal(t: WorkflowTransition): void {
    this.selectedTransition = t;
    this.remark = '';
    this.attachmentId = null;
    this.showProcessModal = true;
  }

  openAssignModal(): void {
    this.assignSelectedUserId = null;
    this.assignRemark = '';
    this.assignAttachmentId = null;
    this.showAssignModal = true;
  }

  onAssignFileUploaded(fileId: string): void {
    this.assignAttachmentId = fileId;
  }

  onAssignFileRemoved(): void {
    this.assignAttachmentId = null;
  }

  assign(): void {
    if (!this.userRequest) return;
    const assignedToId = this.assignSelectedUserId != null ? String(this.assignSelectedUserId) : null;
    if (!assignedToId) return;

    const command: EditUserRequestCommand = {
      remark: this.assignRemark,
      status: this.userRequest.status,
      assignedToId,
      attachment: this.assignAttachmentId,
      userRequestId: this.userRequest.id,
    };

    this.processing = true;
    this.userRequestService.process(command).subscribe({
      next: (res: ApiResponse<UserRequest>) => {
        if (res.success && res.data) {
          this.userRequest = res.data;
        }
        this.processing = false;
        this.showAssignModal = false;
      },
      error: () => {
        this.processing = false;
      },
    });
  }

  onFileUploaded(fileId: string): void {
    this.attachmentId = fileId;
  }

  onFileRemoved(): void {
    this.attachmentId = null;
  }

  process(): void {
    if (!this.userRequest) return;
    if (!this.selectedTransition) return;

    const command: EditUserRequestCommand = {
      remark: this.remark,
      status: this.selectedTransition.nextStatus,
      assignedToId: null,
      attachment: this.attachmentId,
      userRequestId: this.userRequest.id,
    };

    this.processing = true;
    this.userRequestService.process(command).subscribe({
      next: (res: ApiResponse<UserRequest>) => {
        if (res.success && res.data) {
          this.userRequest = res.data;
        }
        this.processing = false;
        this.showProcessModal = false;
        this.loadTransitions();
      },
      error: () => {
        this.processing = false;
      }
    });
  }

  viewAttachment(fileId: string): void {
    this.fileUploadService.getPresignedUrl(fileId).subscribe({
      next: (url) => {
        window.open(url, '_blank');
      }
    });
  }

  toggleActionsDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.showActionsDropdown = !this.showActionsDropdown;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.actions-wrap')) {
      this.showActionsDropdown = false;
    }
  }

  /** Status badge class from UserRequest status or History log status */
  getStatusBadgeClass(status: string): string {
    if (!status) return 'badge-draft';
    const key = status.toLowerCase().replace(/\s+/g, '-');
    const map: Record<string, string> = {
      draft: 'badge-draft',
      submitted: 'badge-submitted',
      approved: 'badge-approved',
      rejected: 'badge-rejected',
      returned: 'badge-returned',
      'under_review': 'badge-under_review',
      'under-review': 'badge-under-review',
      resubmitted: 'badge-resubmitted',
      cancelled: 'badge-cancelled',
    };
    return map[key] || 'badge-draft';
  }
}
