import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompanyProfile } from '../../features/farm-company/models/company-profile.model';

@Component({
  selector: 'app-public-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './public-contact.component.html',
  styleUrl: './public-contact.component.css',
})
export class PublicContactComponent implements OnInit {
  @Input() company: CompanyProfile | null = null;
  @Input() loadingCompany = false;

  contactForm!: FormGroup;
  captchaQuestion = '';
  captchaAnswer = 0;

  submitMessage = '';
  submitError = false;
  submitted = false;
  isSubmitting = false;

  private readonly recipientEmail = 'ossethio@gmail.com';

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.contactForm = this.fb.group({
      name:         ['', [Validators.required, Validators.maxLength(120)]],
      email:        ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
      phone:        ['', [Validators.maxLength(40)]],
      message:      ['', [Validators.required, Validators.maxLength(2000)]],
      captchaInput: ['', [Validators.required]],
    });

    this.refreshCaptcha();
  }

  get displayEmail(): string {
    return this.company?.email || 'info@agrivest.com';
  }

  get displayPhone(): string {
    return this.company?.contactMobilePhone || this.company?.officePhone || '+251 11 123 4567';
  }

  get phoneHref(): string {
    return `tel:${this.displayPhone.replace(/\s/g, '')}`;
  }

  get emailHref(): string {
    return `mailto:${this.displayEmail}`;
  }

  readonly facebookUrl = 'https://www.facebook.com/';
  readonly tiktokUrl   = 'https://www.tiktok.com/';

  refreshCaptcha(): void {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    this.captchaQuestion = `${a} + ${b}`;
    this.captchaAnswer   = a + b;
    this.contactForm?.get('captchaInput')?.reset('');
    this.submitError = false;
  }

  isInvalid(controlName: string): boolean {
    const ctrl = this.contactForm.get(controlName);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched || this.submitted));
  }

  onSubmit(): void {
    this.submitted     = true;
    this.submitMessage = '';
    this.submitError   = false;

    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }

    const enteredAnswer = Number(this.contactForm.value.captchaInput);
    if (isNaN(enteredAnswer) || enteredAnswer !== this.captchaAnswer) {
      this.submitError   = true;
      this.submitMessage = 'Incorrect answer. Please try again.';
      this.refreshCaptcha();
      return;
    }

    const name    = (this.contactForm.value.name    as string).trim();
    const email   = (this.contactForm.value.email   as string).trim();
    const phone   = ((this.contactForm.value.phone  as string) || '').trim();
    const message = (this.contactForm.value.message as string).trim();

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('name',      name);
    formData.append('email',     email);
    formData.append('_replyto',  email);
    formData.append('phone',     phone || 'Not provided');
    formData.append('message',   message);
    formData.append('_subject',  `AgriVest Contact from ${name}`);
    formData.append('_captcha',  'false');

    fetch(`https://formsubmit.co/${this.recipientEmail}`, {
      method: 'POST',
      mode:   'no-cors',
      body:   formData,
    })
      .catch(() => undefined)
      .finally(() => {
        this.isSubmitting  = false;
        this.submitError   = false;
        this.submitMessage = 'Your message has been sent! We will get back to you soon.';
        this.contactForm.reset();
        this.submitted = false;
        this.refreshCaptcha();
      });
  }
}
