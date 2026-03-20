import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Branch} from '../../models/branch.model';

@Component({
  selector: 'app-branch-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './branch-form.component.html',
  styleUrls: ['./branch-form.component.css']
})
export class BranchFormComponent {
  @Input() branch: Branch | null = null;
  @Output() submitForm = new EventEmitter<{ branchName: string; isMainBranch: boolean }>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      branchName: ['', Validators.required],
      isMainBranch: [false]
    });
  }

  ngOnChanges(): void {
    if (this.branch) {
      this.form.patchValue({
        branchName: this.branch.branchName,
        isMainBranch: this.branch.isMainBranch
      });
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.submitForm.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}

