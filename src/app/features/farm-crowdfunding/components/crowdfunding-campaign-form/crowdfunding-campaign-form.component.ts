import {CommonModule} from '@angular/common';
import {Component, Input} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CrowdfundingCampaignCreateRequest, FundingStatus} from '../../models/farm-crowdfunding.model';

@Component({
  selector: 'app-crowdfunding-campaign-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crowdfunding-campaign-form.component.html',
  styleUrl: './crowdfunding-campaign-form.component.css',
})
export class CrowdfundingCampaignFormComponent {
  @Input() disabled = false;

  form: FormGroup;
  statuses: FundingStatus[] = ['OPEN', 'CLOSED', 'FUNDED', 'FAILED'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      targetAmount: [null, [Validators.required, Validators.min(0.01)]],
      minimumContribution: [null, [Validators.required, Validators.min(0.01)]],
      fundingDeadline: ['', Validators.required],
      fundingStatus: ['OPEN', Validators.required],
      description: [''],
    });
  }

  isValid(): boolean {
    return this.form.valid;
  }

  markAllAsTouched(): void {
    this.form.markAllAsTouched();
  }

  getValue(farmOperationId: string): CrowdfundingCampaignCreateRequest {
    const v = this.form.value;
    return {
      farmOperationId,
      title: v.title,
      targetAmount: Number(v.targetAmount),
      minimumContribution: Number(v.minimumContribution),
      fundingDeadline: v.fundingDeadline,
      fundingStatus: v.fundingStatus,
      description: v.description || undefined,
    };
  }
}

