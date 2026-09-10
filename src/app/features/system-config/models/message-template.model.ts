export type TemplateType = 'EMAIL' | 'SMS' | 'CONTRACT';

export type TemplatePurpose =
  // EMAIL
  | 'USER_INVITATION' | 'PASSWORD_RESET' | 'WELCOME'
  | 'INVESTMENT_APPROVED' | 'INVESTMENT_REJECTED' | 'PAYMENT_REMINDER' | 'LEASE_RENEWAL_NOTICE'
  | 'STATUS_UPDATE'
  // SMS
  | 'OTP_VERIFICATION' | 'INVESTMENT_UPDATE' | 'ACCOUNT_NOTIFICATION'
  // CONTRACT
  | 'INVESTMENT_AGREEMENT' | 'LEASE_RENEWAL' | 'FARM_ALLOCATION_AGREEMENT';

export interface PurposeOption {
  value: TemplatePurpose;
  label: string;
}

export const PURPOSE_OPTIONS: Record<TemplateType, PurposeOption[]> = {
  EMAIL: [
    { value: 'USER_INVITATION',     label: 'User Invitation' },
    { value: 'PASSWORD_RESET',      label: 'Password Reset' },
    { value: 'WELCOME',             label: 'Welcome' },
    { value: 'INVESTMENT_APPROVED', label: 'Investment Approved' },
    { value: 'INVESTMENT_REJECTED', label: 'Investment Rejected' },
    { value: 'PAYMENT_REMINDER',    label: 'Payment Reminder' },
    { value: 'LEASE_RENEWAL_NOTICE',label: 'Lease Renewal Notice' },
    { value: 'STATUS_UPDATE',       label: 'Status Update' },
  ],
  SMS: [
    { value: 'OTP_VERIFICATION',    label: 'OTP Verification' },
    { value: 'INVESTMENT_UPDATE',   label: 'Investment Update' },
    { value: 'ACCOUNT_NOTIFICATION',label: 'Account Notification' },
    { value: 'PAYMENT_REMINDER',    label: 'Payment Reminder' },
  ],
  CONTRACT: [
    { value: 'INVESTMENT_AGREEMENT',      label: 'Investment Agreement' },
    { value: 'LEASE_RENEWAL',             label: 'Lease Renewal' },
    { value: 'FARM_ALLOCATION_AGREEMENT', label: 'Farm Allocation Agreement' },
  ],
};

export function purposeLabel(purpose: TemplatePurpose | undefined | null): string {
  if (!purpose) return '—';
  for (const opts of Object.values(PURPOSE_OPTIONS)) {
    const found = opts.find(o => o.value === purpose);
    if (found) return found.label;
  }
  return purpose;
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: TemplateType;
  purpose?: TemplatePurpose;
  subject?: string;
  body: string;
  variables?: string;
  active: boolean;
  defaultTemplate: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MessageTemplateRequest {
  name: string;
  type: TemplateType;
  purpose?: TemplatePurpose | null;
  subject?: string;
  body: string;
  variables?: string;
  active: boolean;
  defaultTemplate: boolean;
}
