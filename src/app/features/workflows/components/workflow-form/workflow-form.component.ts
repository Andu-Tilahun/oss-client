import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {UserRequestType, Workflow, WorkflowStatuses, WorkflowTransitionAction} from "../../models/workflow.model";
import {RepeaterComponent} from '../../../../shared/repeater/repeater/repeater.component';
import {Role} from "../../../users/models/user.model";
import {RoleService} from "../../../users/services/role.service";

@Component({
  selector: 'app-workflow-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RepeaterComponent],
  templateUrl: './workflow-form.component.html',
  styleUrls: ['./workflow-form.component.css']
})
export class WorkflowFormComponent implements OnInit, OnChanges {
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() workflow: Workflow | null = null;

  workflowForm!: FormGroup;
  loading = false;

  workflowStatuses = Object.values(WorkflowStatuses);
  requestTypes = Object.values(UserRequestType);
  workflowTransitionActions = [null, ...Object.values(WorkflowTransitionAction)] as (WorkflowTransitionAction | null)[];
  actionLabels: Record<string, string> = {
    '': 'None',
    [WorkflowTransitionAction.ASSIGN_EXPERT]: 'ASSIGN_EXPERT'
  };
  roles: Role[] = [];

  constructor(
    private fb: FormBuilder,
    private roleService: RoleService,
  ) {
    this.initForm();
  }

  ngOnInit() {
    if (this.mode === 'edit' && this.workflow) {
      this.patchFormValues(this.workflow);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['workflow'] && this.workflow && this.mode === 'edit') {
      this.patchFormValues(this.workflow);
    }

    if (changes['mode'] && this.mode === 'create' && !this.roles.length) {
      this.loadRoles();
    }
  }

  initForm() {
    this.workflowForm = this.fb.group({
      name: ['', Validators.required],
      requestType: ['', Validators.required],
      workflowTransitions: this.fb.array([])
    });

    if (this.mode === 'create') {
      this.addTransition();
    }

    this.loadRoles();
  }

  get transitions(): FormArray {
    return this.workflowForm.get('workflowTransitions') as FormArray;
  }

  get hasTransitions(): boolean {
    return this.transitions.length > 0;
  }

  createTransition(): FormGroup {
    return this.fb.group({
      id: [null],
      currentStatus: ['', Validators.required],
      nextStatus: ['', Validators.required],
      roleId: ['', Validators.required],
      label: ['', Validators.required],
      action: [null as WorkflowTransitionAction | null]
    });
  }

  addTransition() {
    this.transitions.push(this.createTransition());
  }

  removeTransition(index: number) {
    this.transitions.removeAt(index);
  }

  isDuplicateTransition(index: number): boolean {
    const currentGroup = this.transitions.at(index) as FormGroup;
    const currentStatus = currentGroup.get('currentStatus')?.value;
    const nextStatus = currentGroup.get('nextStatus')?.value;

    if (!currentStatus || !nextStatus) {
      return false;
    }

    return this.transitions.controls.some((control, i) => {
      if (i === index) {
        return false;
      }

      const group = control as FormGroup;
      return (
        group.get('currentStatus')?.value === currentStatus &&
        group.get('nextStatus')?.value === nextStatus
      );
    });
  }

  hasSameStatus(index: number): boolean {
    const currentGroup = this.transitions.at(index) as FormGroup;
    const currentStatus = currentGroup.get('currentStatus')?.value;
    const nextStatus = currentGroup.get('nextStatus')?.value;

    if (!currentStatus || !nextStatus) {
      return false;
    }

    return currentStatus === nextStatus;
  }

  hasValidationErrors(): boolean {
    if (this.workflowForm.invalid) {
      return true;
    }

    return this.transitions.controls.some((_, index) =>
      this.isDuplicateTransition(index) || this.hasSameStatus(index)
    );
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

  private patchFormValues(workflow: Workflow): void {
    this.workflowForm.patchValue({
      name: workflow.name,
      requestType: workflow.requestType
    });

    this.transitions.clear();
    workflow.workflowTransitions?.forEach(transition => {
      const transitionGroup = this.createTransition();
      transitionGroup.patchValue(transition);
      this.transitions.push(transitionGroup);
    });
  }

  isValid(): boolean {
    return this.workflowForm.valid;
  }

  getValue(): Workflow {
    return this.workflowForm.getRawValue();
  }

  markAllAsTouched(): void {
    Object.keys(this.workflowForm.controls).forEach(key => {
      this.workflowForm.get(key)?.markAsTouched();
    });
    this.transitions.controls.forEach(control => {
      Object.keys((control as FormGroup).controls).forEach(key => {
        control.get(key)?.markAsTouched();
      });
    });
  }

  reset(): void {
    this.workflowForm.reset();
    this.transitions.clear();

    if (this.mode === 'create') {
      this.addTransition();
    }
  }

  // Utility for external submit handlers
  validateAndTouch(): boolean {
    if (this.workflowForm.invalid) {
      this.markAllAsTouched();
      return false;
    }
    return true;
  }
}
