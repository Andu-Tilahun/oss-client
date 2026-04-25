import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PublicHeaderComponent} from '../public-header/public-header.component';
import {PublicFooterComponent} from '../public-footer/public-footer.component';

interface TermsSection {
  title: string;
  content: string[];
}

@Component({
  selector: 'app-public-terms',
  standalone: true,
  imports: [CommonModule, PublicHeaderComponent, PublicFooterComponent],
  templateUrl: './public-terms.component.html',
  styleUrl: './public-terms.component.css',
})
export class PublicTermsComponent {
  readonly sections: TermsSection[] = [
    {
      title: 'Account Registration and Eligibility',
      content: [
        'You must provide accurate and complete information when creating an account.',
        'You are responsible for maintaining the confidentiality of your account credentials.',
        'You must be legally capable of entering binding agreements to use this service.',
      ],
    },
    {
      title: 'Investment Risks and Responsibilities',
      content: [
        'Agricultural investments involve market, climate, and operational risks.',
        'Past performance does not guarantee future returns.',
        'You are responsible for reviewing opportunities and making informed investment decisions.',
      ],
    },
    {
      title: 'Platform Use and Conduct',
      content: [
        'You agree to use the platform only for lawful purposes.',
        'You must not attempt to disrupt, misuse, or gain unauthorized access to the platform.',
        'We may suspend or terminate accounts that violate these Terms.',
      ],
    },
    {
      title: 'Fees, Payments, and Refunds',
      content: [
        'Applicable service fees will be disclosed before you complete transactions.',
        'Payments are processed through approved channels and subject to verification.',
        'Refund policies vary by investment product and are communicated in product terms.',
      ],
    },
  ];

  readonly contactInfo = {
    email: 'info@agrivest.et',
    phone: '+251 11 123 4567',
    address: 'Addis Ababa, Ethiopia',
  };
}

