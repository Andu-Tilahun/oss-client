import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PublicHeaderComponent} from '../public-header/public-header.component';
import {PublicFooterComponent} from '../public-footer/public-footer.component';

interface PolicySection {
  title: string;
  content: string[];
}

@Component({
  selector: 'app-public-privacy',
  standalone: true,
  imports: [CommonModule, PublicHeaderComponent, PublicFooterComponent],
  templateUrl: './public-privacy.component.html',
  styleUrl: './public-privacy.component.css',
})
export class PublicPrivacyComponent {
  readonly lastUpdated = 'today';

  readonly sections: PolicySection[] = [
    {
      title: 'Information We Collect',
      content: [
        'Personal information you provide, including name, email, phone number, and account details.',
        'Investment-related information such as preferences, transactions, and portfolio activity.',
        'Technical information including IP address, browser type, and usage analytics.',
      ],
    },
    {
      title: 'How We Use Your Information',
      content: [
        'To provide, operate, and improve our platform and investment services.',
        'To verify identity, process transactions, and communicate important updates.',
        'To comply with legal obligations and protect users from fraud and abuse.',
      ],
    },
    {
      title: 'Data Sharing and Disclosure',
      content: [
        'We may share data with trusted service providers who support platform operations.',
        'We may disclose information when required by law, regulation, or legal process.',
        'We do not sell your personal information to third parties for unrelated marketing.',
      ],
    },
    {
      title: 'Data Security and Retention',
      content: [
        'We implement technical and organizational measures to protect your data.',
        'Information is retained only as long as necessary for service delivery and compliance.',
        'Despite safeguards, no digital system can guarantee absolute security.',
      ],
    },
  ];

  readonly contactInfo = {
    email: 'info@agrivest.et',
    phone: '+251 11 123 4567',
    address: 'Addis Ababa, Ethiopia',
  };
}

