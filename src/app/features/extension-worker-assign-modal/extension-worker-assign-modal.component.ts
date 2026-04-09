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
import {ModalComponent} from "../../shared/modals/modal/modal.component";
import {USER_REQUEST_TYPE_ROLE_MAP, UserRequest} from "../../shared/user-request/models/user-request.model";
import {User} from "../users/models/user.model";
import {UserService} from "../users/services/user.service";

@Component({
  selector: 'app-extension-worker-assign-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent
  ],
  templateUrl: './extension-worker-assign-modal.component.html',
  styleUrl: './extension-worker-assign-modal.component.css'
})
export class ExtensionWorkerAssignModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();



  @Input() selectedUserId: string | string | null = null;
  @Output() selectedUserIdChange = new EventEmitter<string | string | null>();

  @Output() confirm = new EventEmitter<void>();

  assignableUsers: User[] = [];
  loadingUsers = false;

  constructor(private userService: UserService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']?.currentValue === true ) {
      this.loadUsers();
    }
    if (changes['visible']?.currentValue === false) {
      this.assignableUsers = [];
    }
  }

  private loadUsers(): void {
    this.loadingUsers = true;
    this.userService.getUsersByRole("EXTENSION_WORKER").subscribe({
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
