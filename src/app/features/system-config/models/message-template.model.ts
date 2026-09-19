export type TemplateType = 'EMAIL' | 'SMS' | 'CONTRACT';

export type TemplatePurpose =
  // EMAIL
  | 'USER_INVITATION' | 'PASSWORD_RESET' | 'WELCOME'
  | 'INVESTMENT_APPROVED' | 'INVESTMENT_REJECTED' | 'PAYMENT_REMINDER' | 'LEASE_RENEWAL_NOTICE'
  | 'STATUS_UPDATE'
  | 'INVESTMENT_CANDIDATE_SELECTED' | 'CONTRACT_READY_TO_SIGN' | 'CONTRACT_SIGNED'
  | 'INVESTMENT_PAYMENT_RECEIVED' | 'INVESTMENT_APPLICATION_SUBMITTED' | 'INVESTMENT_COMPLETED'
  | 'INVESTOR_WELCOME' | 'PAYMENT_REQUEST_CREATED' | 'PAYMENT_COMPLETED'
  | 'LICENSE_REGISTRATION_RECEIVED' | 'LICENSE_APPLICATION_SUBMITTED' | 'LICENSE_MORE_INFO_REQUESTED'
  | 'INVESTMENT_DEADLINE_REMINDER'
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
    { value: 'INVESTMENT_CANDIDATE_SELECTED',    label: 'Investment Candidate Selected' },
    { value: 'CONTRACT_READY_TO_SIGN',           label: 'Contract Ready to Sign' },
    { value: 'CONTRACT_SIGNED',                  label: 'Contract Signed' },
    { value: 'INVESTMENT_PAYMENT_RECEIVED',      label: 'Investment Payment Received' },
    { value: 'INVESTMENT_APPLICATION_SUBMITTED', label: 'Investment Application Submitted' },
    { value: 'INVESTMENT_COMPLETED',             label: 'Investment Completed' },
    { value: 'INVESTOR_WELCOME',                 label: 'Investor Welcome' },
    { value: 'PAYMENT_REQUEST_CREATED',          label: 'Payment Request Created' },
    { value: 'PAYMENT_COMPLETED',                label: 'Payment Completed' },
    { value: 'LICENSE_REGISTRATION_RECEIVED',    label: 'License Registration Received' },
    { value: 'LICENSE_APPLICATION_SUBMITTED',    label: 'License Application Submitted' },
    { value: 'LICENSE_MORE_INFO_REQUESTED',      label: 'License More Info Requested' },
    { value: 'INVESTMENT_DEADLINE_REMINDER',     label: 'Investment Deadline Reminder' },
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

export type TemplateService = 'user-service' | 'farm-service' | 'payment-service' | 'license-service' | 'shared';

export const SERVICE_OPTIONS: { value: TemplateService; label: string }[] = [
  { value: 'user-service',    label: 'User Service' },
  { value: 'farm-service',    label: 'Farm Service' },
  { value: 'payment-service', label: 'Payment Service' },
  { value: 'license-service', label: 'License Service' },
  { value: 'shared',          label: 'Shared' },
];

const PURPOSE_SERVICE_MAP: Partial<Record<TemplatePurpose, TemplateService>> = {
  USER_INVITATION: 'user-service',
  PASSWORD_RESET: 'user-service',
  WELCOME: 'user-service',
  INVESTOR_WELCOME: 'user-service',
  INVESTMENT_APPROVED: 'farm-service',
  INVESTMENT_REJECTED: 'farm-service',
  INVESTMENT_CANDIDATE_SELECTED: 'farm-service',
  CONTRACT_READY_TO_SIGN: 'farm-service',
  CONTRACT_SIGNED: 'farm-service',
  INVESTMENT_PAYMENT_RECEIVED: 'farm-service',
  INVESTMENT_APPLICATION_SUBMITTED: 'farm-service',
  INVESTMENT_COMPLETED: 'farm-service',
  INVESTMENT_DEADLINE_REMINDER: 'farm-service',
  LEASE_RENEWAL_NOTICE: 'farm-service',
  PAYMENT_REMINDER: 'payment-service',
  PAYMENT_REQUEST_CREATED: 'payment-service',
  PAYMENT_COMPLETED: 'payment-service',
  LICENSE_REGISTRATION_RECEIVED: 'license-service',
  LICENSE_APPLICATION_SUBMITTED: 'license-service',
  LICENSE_MORE_INFO_REQUESTED: 'license-service',
  STATUS_UPDATE: 'shared',
};

export function purposeService(purpose: TemplatePurpose | undefined | null): TemplateService | null {
  if (!purpose) return null;
  return PURPOSE_SERVICE_MAP[purpose] ?? null;
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
