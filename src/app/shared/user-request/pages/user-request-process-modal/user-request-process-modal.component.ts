import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ModalComponent} from '../../../modals/modal/modal.component';
import {DocumentUploadComponent} from '../../../file-upload/document-upload/document-upload.component';
import {WorkflowTransition} from '../../models/user-request.model';

@Component({
  selector: 'app-user-request-process-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    DocumentUploadComponent,
  ],
  template: `
    <app-modal
      [visible]="visible"
      (visibleChange)="visibleChange.emit($event)"
      title="Process User Request"
      confirmText="Save"
      cancelText="Cancel"
      [confirmLoading]="processing"
      (confirm)="confirm.emit()"
    >
      <div class="space-y-4">
        <div class="text-sm text-gray-700">
          Next status:
          <span class="font-semibold text-gray-900">
            {{ selectedTransition?.nextStatus }}
          </span>
        </div>

        <div>
          <label class="text-sm font-medium text-gray-700">Remark</label>
          <textarea
            class="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
            rows="3"
            [ngModel]="remark"
            (ngModelChange)="remarkChange.emit($event)"
          ></textarea>
        </div>

        <div>
          <app-document-upload
            label="Attachment (optional)"
            [required]="false"
            (fileUploaded)="fileUploaded.emit($event)"
            (fileRemoved)="fileRemoved.emit()"
          ></app-document-upload>
        </div>
      </div>
    </app-modal>
  `,
})
export class UserRequestProcessModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() processing = false;
  @Input() selectedTransition?: WorkflowTransition;

  @Input() remark = '';
  @Output() remarkChange = new EventEmitter<string>();

  @Output() confirm = new EventEmitter<void>();
  @Output() fileUploaded = new EventEmitter<string>();
  @Output() fileRemoved = new EventEmitter<void>();
}

