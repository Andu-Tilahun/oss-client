import {Component, EventEmitter, forwardRef, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {Role, User} from "../../models/user.model";
import {
  ProfilePictureUploadComponent
} from "../../../../shared/file-upload/profile-picture-upload/profile-picture-upload.component";
import {DocumentUploadComponent} from "../../../../shared/file-upload/document-upload/document-upload.component";
import {RoleService} from "../../services/role.service";
import {Employee} from "../../../employees/models/employee.model";
import {AuthService} from "../../../auth/services/auth.service";

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProfilePictureUploadComponent, DocumentUploadComponent],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => UserFormComponent),
      multi: true
    }
  ]
})
export class UserFormComponent implements OnInit, OnChanges, ControlValueAccessor {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() user: User | null = null;
  /** Restricts (and, when exactly one, auto-selects + locks) the role options offered in create mode. */
  @Input() allowedRoleNames: string[] = ['ADMIN', 'OPERATOR', 'EXTENSION_WORKER'];
  @ViewChild(ProfilePictureUploadComponent) profilePictureUpload?: ProfilePictureUploadComponent;
  userForm: FormGroup;
  @Input() profileUpdate = false;
  @Input() profileImageInline = true;
  /** Fires right after a photo finishes uploading — lets the parent persist it immediately
   *  instead of relying on a later, separate form submit that the user might never trigger. */
  @Output() profileImageUploaded = new EventEmitter<string>();
  roles: Role[] = [];
  employees: Employee[] = [];

  // role-based flags
  selectedRole: Role | null = null;
  isEmployee = false;
  private onChange: any = () => {
  };
  private onTouched: any = () => {
  };

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
    private authService: AuthService
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit() {
    // Subscribe to form changes and propagate to parent
    this.userForm.valueChanges.subscribe(value => {
      this.onChange(value);
    });

    if (this.authService.isAdmin()) {
      this.loadRoles();
    }

    this.userForm.get('roleId')?.valueChanges.subscribe((roleId) => {
      this.onRoleChange(roleId);
    });

    // initialize role-based visibility if role is pre-set
    const initialRoleId = this.userForm.get('roleId')?.value;
    if (initialRoleId) {
      this.onRoleChange(initialRoleId);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // If user data changes (edit mode), update form
    if (changes['user'] && this.user && this.mode === 'edit') {
      this.patchFormValues(this.user);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      middleName: [''],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      gender: ['', Validators.required],
      profileImageUuid: [''],
      roleId: ['', Validators.required],
      regionId: [''],
      organizationId: [''],
      branchId: [''],
      employeeId: [''],
    });
  }

  private patchFormValues(user: User) {
    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName || '',
      username: user.username,
      email: user.email,
      gender: user.gender,
      profileImageUuid: user.profileImageUuid || '',
      regionId: user.regionId || '',
      organizationId: user.organizationId || '',
      branchId: user.branchId || '',
      employeeId: user.employeeId || ''
    });

    // Disable username in edit mode (usually shouldn't be changed)
    if (this.mode === 'edit') {
      this.userForm.get('username')?.disable();
      // Role is assigned at creation time only for now
      this.userForm.get('roleId')?.clearValidators();
      this.userForm.get('roleId')?.updateValueAndValidity();
      this.userForm.get('roleId')?.disable();
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    if (value) {
      this.userForm.patchValue(value, {emitEvent: false});
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    isDisabled ? this.userForm.disable() : this.userForm.enable();
  }

  // Public methods
  isValid(): boolean {
    return this.userForm.valid;
  }

  getValue(): any {
    // Include disabled fields (like username in edit mode)
    return this.userForm.getRawValue();
  }

  markAllAsTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.markAsTouched();
    });
  }

  reset(): void {
    this.userForm.reset();
  }

  get showBranchField(): boolean {
    return !this.isEmployee;
  }

  get showEmployeeField(): boolean {
    return this.isEmployee;
  }

  setProfileImageUuid(fileId: string): void {
    this.onProfilePictureUploaded(fileId);
  }

  onProfilePictureUploaded(fileId: string) {
    this.userForm.patchValue({profileImageUuid: fileId});
    if (this.user) {
      this.user.profileImageUuid = fileId;
    }
    this.profileImageUploaded.emit(fileId);
  }

  onProfilePictureRemoved() {
    this.userForm.patchValue({profileImageUuid: ''});
    if (this.user) {
      this.user.profileImageUuid = undefined;
    }
  }

  hasPendingProfileUpload(): boolean {
    return this.profilePictureUpload?.hasPendingUpload() ?? false;
  }

  get pendingProfilePreviewUrl(): string | undefined {
    return this.profilePictureUpload?.pendingPreviewUrl;
  }

  get profileImageFileId(): string | undefined {
    return this.userForm.get('profileImageUuid')?.value || this.user?.profileImageUuid || undefined;
  }

  private loadRoles(): void {
    this.roleService.getRoles(0, 100, 'id', 'ASC').subscribe({
      next: (page) => {
        this.roles = page.content.filter(r => this.allowedRoleNames.includes(r.roleName));
        this.applyRoleLock();
      },
      error: (error) => {
        console.error('Failed to load roles', error);
      }
    });
  }

  /** When the caller only allows a single role, pre-select it and lock the field (mirrors the edit-mode roleId disable in patchFormValues). */
  private applyRoleLock(): void {
    if (this.allowedRoleNames.length !== 1) {
      return;
    }
    const onlyRole = this.roles.find(r => r.roleName === this.allowedRoleNames[0]);
    if (!onlyRole) {
      return;
    }
    this.userForm.get('roleId')?.setValue(onlyRole.id);
    this.userForm.get('roleId')?.disable();
  }


  private onRoleChange(roleId: string): void {
    this.selectedRole = this.roles.find(r => r.id === roleId) || null;
    const roleName = this.selectedRole?.roleName || '';

    this.isEmployee = roleName === 'EMPLOYEE';
    const employeeCtrl = this.userForm.get('employeeId');

    if (!employeeCtrl) {
      return;
    }

    employeeCtrl.clearValidators();
    if (this.isEmployee) {
      employeeCtrl.setValidators([Validators.required]);
    }
    employeeCtrl.updateValueAndValidity();
  }
}
