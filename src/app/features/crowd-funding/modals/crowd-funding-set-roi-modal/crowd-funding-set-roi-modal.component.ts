import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ModalComponent} from '../../../../shared/modals/modal/modal.component';
import {ToastService} from '../../../../shared/toast/toast.service';
import {CrowdFundingService} from '../../services/crowd-funding.service';
import {InvestmentRecord} from '../../models/crowd-funding.model';

@Component({
  selector: 'app-crowd-funding-set-roi-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, ReactiveFormsModule],
  templateUrl: './crowd-funding-set-roi-modal.component.html',
})
export class CrowdFundingSetRoiModalComponent {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() roiSaved = new EventEmitter<void>();

  @Input() investment: InvestmentRecord | null = null;

  isSaving = false;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private crowdfundingService: CrowdFundingService,
    private toastService: ToastService,
  ) {
    this.form = this.fb.group({
      roi: ['', Validators.required],
    });
  }

  ngOnChanges(): void {
    this.form.patchValue({roi: this.investment?.roi ?? ''}, {emitEvent: false});
  }

  submit(): void {
    const id = this.investment?.id;
    if (!id) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const roi = (this.form.value.roi ?? '').toString();
    this.isSaving = true;
    this.crowdfundingService.adminSetRoi(id, roi).subscribe({
      next: () => {
        this.isSaving = false;
        this.toastService.success('ROI saved successfully');
        this.visible = false;
        this.visibleChange.emit(false);
        this.roiSaved.emit();
      },
      error: (error) => {
        this.isSaving = false;
        this.toastService.error(error.message || 'Failed to save ROI', 'Set ROI');
      },
    });
  }
}

