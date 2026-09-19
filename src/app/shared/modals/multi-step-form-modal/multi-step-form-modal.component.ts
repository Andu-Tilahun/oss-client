import { Component, ContentChild, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent, ModalSize } from '../modal/modal.component';
import { StepConfig, StepperComponent } from '../../components/stepper/stepper.component';

@Component({
  selector: 'app-multi-step-form-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, StepperComponent],
  templateUrl: './multi-step-form-modal.component.html',
})
export class MultiStepFormModalComponent {
  @Input() visible = false;
  @Input() title = '';
  @Input() steps: StepConfig[] = [];
  @Input() currentStep = 1;
  @Input() size: ModalSize = 'xxl';
  @Input() maskClosable = false;
  @Input() isSubmitting = false;
  @Input() nextLabel = 'Next';
  @Input() backLabel = 'Back';
  @Input() submitLabel = 'Submit';
  @Input() cancelText = 'Cancel';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() currentStepChange = new EventEmitter<number>();
  @Output() next = new EventEmitter<void>();
  @Output() submitForm = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @ContentChild('stepBody') stepBody: TemplateRef<any> | null = null;
  @ViewChild(ModalComponent) modalComponent!: ModalComponent;

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStepChange.emit(this.currentStep - 1);
    }
  }

  goToStep(step: number): void {
    this.currentStepChange.emit(step);
  }

  handleClosed(): void {
    this.cancelled.emit();
  }
}
