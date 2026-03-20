import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../base-modal/modal.component';
import {ModalComponent} from "../modal/modal.component";

@Component({
  selector: 'app-form-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ModalComponent],
  templateUrl: './form-modal.component.html',
  styleUrls: ['./form-modal.component.css']
})
export class FormModalComponent {
  @Input() visible = false;
  @Input() title = 'Form';
  @Input() submitText = 'Submit';
  @Input() cancelText = 'Cancel';
  @Input() submitLoading = false;
  @Input() submitDisabled = false;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  @ContentChild('formContent') formContent: TemplateRef<any> | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() submit = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  handleSubmit() {
    this.submit.emit();
  }

  handleCancel() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.cancel.emit();
  }
}
