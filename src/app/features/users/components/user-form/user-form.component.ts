import {Component, forwardRef, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
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
import {EmployeeService} from "../../../employees/services/employee.service";

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
  profileImageUuid?: string;
  userForm: FormGroup;
  @Input() profileUpdate = false;
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
    private employeeService: EmployeeService
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit() {
    // Subscribe to form changes and propagate to parent
    this.userForm.valueChanges.subscribe(value => {
      this.onChange(value);
    });

    this.loadRoles();
    this.loadEmployees();

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
      password: ['', this.mode === 'create' ? [Validators.required, Validators.minLength(6)] : []],
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
      // Remove password requirement in edit mode
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();

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

  get showPasswordField(): boolean {
    return this.mode === 'create';
  }

  get showBranchField(): boolean {
    return !this.isEmployee;
  }

  get showEmployeeField(): boolean {
    return this.isEmployee;
  }

  onProfilePictureUploaded(fileId: string) {
    if (this.user) {
      this.user.profileImageUuid = fileId;
      this.patchFormValues(this.user);
    }

  }

  onProfilePictureRemoved() {
    if (this.user) {
      this.user.profileImageUuid = undefined;
      this.patchFormValues(this.user);
    }
  }

  private loadRoles(): void {
    this.roleService.getRoles(0, 100, 'id', 'ASC').subscribe({
      next: (page) => {
        this.roles = page.content;
      },
      error: (error) => {
        console.error('Failed to load roles', error);
      }
    });
  }

  private loadEmployees(): void {
    this.employeeService.getAllActive().subscribe({
      next: (list) => {
        this.employees = list ?? [];
      },
      error: (error) => {
        console.error('Failed to load employees', error);
      }
    });
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
