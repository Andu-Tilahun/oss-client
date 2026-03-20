import {
  Component,
  forwardRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  Employee,
  EmployeeRequest,
  Gender,
  EmployeeStatus,
} from '../../models/employee.model';
import { Department } from '../../../departments/models/department.model';
import { DepartmentService } from '../../../departments/services/department.service';
import { ProfilePictureUploadComponent } from '../../../../shared/file-upload/profile-picture-upload/profile-picture-upload.component';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ProfilePictureUploadComponent],
  templateUrl: './employee-form.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EmployeeFormComponent),
      multi: true,
    },
  ],
})
export class EmployeeFormComponent implements OnInit, OnChanges, ControlValueAccessor {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() employee: Employee | null = null;

  employeeForm: FormGroup;
  departments: Department[] = [];
  readonly genders: Gender[] = ['Male', 'Female', 'Other', 'PREFER_NOT_TO_SAY'];
  readonly statuses: EmployeeStatus[] = ['Active', 'Inactive'];

  private onChange: (value: EmployeeRequest) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private fb: FormBuilder,
    private departmentService: DepartmentService
  ) {
    this.employeeForm = this.createForm();
  }

  ngOnInit(): void {
    this.employeeForm.valueChanges.subscribe((value) => {
      this.onChange(this.buildRequest(value));
    });
    this.loadDepartments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employee'] && this.employee && this.mode === 'edit') {
      this.patchFormValues(this.employee);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      position: [''],
      departmentId: [''],
      gender: ['Male', Validators.required],
      age: [null as number | null],
      status: ['Active'],
      photoId: [''],
    });
  }

  private patchFormValues(emp: Employee): void {
    this.employeeForm.patchValue({
      name: emp.name,
      position: emp.position || '',
      departmentId: emp.departmentId || '',
      gender: emp.gender || 'Male',
      age: emp.age ?? null,
      status: emp.status || 'Active',
      photoId: emp.photoId || '',
    });
  }

  private buildRequest(value: any): EmployeeRequest {
    return {
      name: value.name,
      position: value.position || undefined,
      departmentId: value.departmentId || undefined,
      gender: value.gender,
      age: value.age ?? undefined,
      status: value.status || 'Active',
      photoId: value.photoId || undefined,
    };
  }

  private loadDepartments(): void {
    this.departmentService.getAll().subscribe({
      next: (list) => (this.departments = list ?? []),
      error: (err) => console.error('Failed to load departments', err),
    });
  }

  writeValue(value: EmployeeRequest | null): void {
    if (value) {
      this.employeeForm.patchValue({
        name: value.name,
        position: value.position || '',
        departmentId: value.departmentId || '',
        gender: value.gender || 'Male',
        age: value.age ?? null,
        status: value.status || 'Active',
        photoId: value.photoId || '',
      });
    }
  }

  registerOnChange(fn: (v: EmployeeRequest) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.employeeForm.disable() : this.employeeForm.enable();
  }

  isValid(): boolean {
    return this.employeeForm.valid;
  }

  getValue(): EmployeeRequest {
    const v = this.employeeForm.getRawValue();
    return this.buildRequest(v);
  }

  markAllAsTouched(): void {
    Object.keys(this.employeeForm.controls).forEach((key) => {
      this.employeeForm.get(key)?.markAsTouched();
    });
  }

  reset(): void {
    this.employeeForm.reset({
      name: '',
      position: '',
      departmentId: '',
      gender: 'Male',
      age: null,
      status: 'Active',
      photoId: '',
    });
  }

  onPhotoUploaded(photoId: string): void {
    this.employeeForm.patchValue({ photoId });
  }

  onPhotoRemoved(): void {
    this.employeeForm.patchValue({ photoId: '' });
  }
}
