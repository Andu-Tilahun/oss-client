import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

export type ReferenceChoice = 'existing' | 'new';

@Component({
  selector: 'app-reference-number-choice',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reference-number-choice.component.html',
  styleUrls: ['./reference-number-choice.component.css'],
})
export class ReferenceNumberChoiceComponent {
  @Input() choice: ReferenceChoice | null = null;
  @Output() choiceChange = new EventEmitter<ReferenceChoice>();

  @Input() loading = false;

  @Input() existingLabel = 'Yes, I have a reference number';
  @Input() newLabel = 'No, create a new registration';
  @Input() placeholder = 'Reference Number';
  @Input() loadButtonText = 'Load';

  @Output() load = new EventEmitter<string>();

  form = this.fb.group({
    referenceNumber: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(private fb: FormBuilder) {}

  onSelect(next: ReferenceChoice): void {
    this.choiceChange.emit(next);
    if (next !== 'existing') {
      this.form.reset();
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    const ref = String(this.form.value.referenceNumber ?? '').trim();
    if (!ref) return;
    this.load.emit(ref);
  }
}

