import { describe, it, expect } from 'vitest';
import { MENU } from './menu';

describe('MENU — Templates section', () => {
  const templatesItem = MENU.find(item => item.label === 'Templates');

  it('exists in the sidebar menu', () => {
    expect(templatesItem).toBeDefined();
  });

  it('is restricted to ADMIN role only', () => {
    expect(templatesItem?.roles).toEqual(['ADMIN']);
  });

  it('routes to /templates/email', () => {
    expect(templatesItem?.route).toBe('/templates/email');
  });

  it('has exactly 3 children: Email, SMS, Contract', () => {
    expect(templatesItem?.children).toHaveLength(3);
    const labels = templatesItem?.children?.map(c => c.label);
    expect(labels).toContain('Email');
    expect(labels).toContain('SMS');
    expect(labels).toContain('Contract');
  });

  it('Email child routes to /templates/email', () => {
    const email = templatesItem?.children?.find(c => c.label === 'Email');
    expect(email?.route).toBe('/templates/email');
    expect(email?.roles).toContain('ADMIN');
  });

  it('SMS child routes to /templates/sms', () => {
    const sms = templatesItem?.children?.find(c => c.label === 'SMS');
    expect(sms?.route).toBe('/templates/sms');
  });

  it('Contract child routes to /templates/contract', () => {
    const contract = templatesItem?.children?.find(c => c.label === 'Contract');
    expect(contract?.route).toBe('/templates/contract');
  });
});
