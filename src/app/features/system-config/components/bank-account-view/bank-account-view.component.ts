import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BankAccount } from '../../models/bank-account.model';
import { DetailCardComponent } from '../../../../shared/components/detail-field/detail-card/detail-card.component';
import { DetailSectionComponent } from '../../../../shared/components/detail-field/detail-section/detail-section.component';
import { DetailFieldComponent } from '../../../../shared/components/detail-field/detail-field/detail-field.component';

@Component({
  selector: 'app-bank-account-view',
  standalone: true,
  imports: [CommonModule, DetailCardComponent, DetailSectionComponent, DetailFieldComponent],
  templateUrl: './bank-account-view.component.html',
})
export class BankAccountViewComponent {
  @Input() account: BankAccount | null = null;
}
