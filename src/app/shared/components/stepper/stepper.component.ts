import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface StepConfig {
  label: string;
  description?: string;
  clickable?: boolean;
}

@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stepper.component.html',
})
export class StepperComponent {
  @Input() steps: StepConfig[] = [];
  @Input() currentStep = 1;
  @Output() stepChange = new EventEmitter<number>();

  onStepClick(index: number): void {
    const stepNumber = index + 1;
    const step = this.steps[index];

    if (!step?.clickable) {
      return;
    }

    if (stepNumber < this.currentStep) {
      this.stepChange.emit(stepNumber);
    }
  }
}

