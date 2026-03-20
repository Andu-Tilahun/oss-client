import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../modals/modal/modal.component';
import { DocumentUploadComponent } from '../../../file-upload/document-upload/document-upload.component';
import { UserRequest, USER_REQUEST_TYPE_ROLE_MAP } from '../../models/user-request.model';
import { User } from '../../../../features/users/models/user.model';
import { UserService } from '../../../../features/users/services/user.service';

@Component({
  selector: 'app-user-request-assign-modal',
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
      title="Assign Officer"
      confirmText="Assign"
      cancelText="Cancel"
      [confirmLoading]="processing"
      [confirmDisabled]="!selectedUserId || loadingUsers"
      (confirm)="confirm.emit()"
    >
      <div class="space-y-4">
        <div *ngIf="!userRequest" class="text-sm text-amber-700">
          No request selected.
        </div>

        <ng-container *ngIf="userRequest">
          <div class="text-sm text-gray-700">
            Request:
            <span class="font-semibold text-gray-900">{{ userRequest.requestType }}</span>
            ({{ userRequest.applicationNumber }})
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700">Assign to <span class="text-red-500">*</span></label>
            <select
              class="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              [ngModel]="selectedUserId"
              (ngModelChange)="selectedUserIdChange.emit($event)"
              [disabled]="loadingUsers"
            >
              <option [ngValue]="null">Select user...</option>
              <option *ngFor="let u of assignableUsers" [ngValue]="u.id">
                {{ getDisplayName(u) }}
              </option>
            </select>
            <div *ngIf="loadingUsers" class="mt-1 text-xs text-slate-500">Loading users...</div>
            <div *ngIf="!loadingUsers && assignableUsers.length === 0 && roleForRequest" class="mt-1 text-xs text-amber-600">
              No users found for role {{ roleForRequest }}.
            </div>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700">Remark</label>
            <textarea
              class="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              rows="3"
              [ngModel]="remark"
              (ngModelChange)="remarkChange.emit($event)"
              placeholder="Optional comment"
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
        </ng-container>
      </div>
    </app-modal>
  `,
})
export class UserRequestAssignModalComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();

  @Input() userRequest: UserRequest | null = null;
  @Input() processing = false;

  @Input() selectedUserId: string | number | null = null;
  @Output() selectedUserIdChange = new EventEmitter<string | number | null>();

  @Input() remark = '';
  @Output() remarkChange = new EventEmitter<string>();

  @Output() confirm = new EventEmitter<void>();
  @Output() fileUploaded = new EventEmitter<string>();
  @Output() fileRemoved = new EventEmitter<void>();

  assignableUsers: User[] = [];
  loadingUsers = false;
  roleForRequest: string | null = null;

  constructor(private userService: UserService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true && this.userRequest) {
      this.loadUsers();
    }
    if (changes['visible']?.currentValue === false) {
      this.assignableUsers = [];
      this.roleForRequest = null;
    }
  }

  private loadUsers(): void {
    if (!this.userRequest?.requestType) {
      this.assignableUsers = [];
      return;
    }
    const role = USER_REQUEST_TYPE_ROLE_MAP[this.userRequest.requestType] ?? 'OPERATOR';
    this.roleForRequest = role;
    this.loadingUsers = true;
    this.userService.getUsersByRole(role).subscribe({
      next: (users: User[]) => {
        this.assignableUsers = users ?? [];
        this.loadingUsers = false;
      },
      error: () => {
        this.assignableUsers = [];
        this.loadingUsers = false;
      },
    });
  }

  getDisplayName(u: User): string {
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
    return name || u.username || String(u.id);
  }
}
