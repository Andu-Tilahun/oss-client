import { describe, it, expect } from 'vitest';
import {
  bankAccountRoute,
  farmPlotRoute,
  galleryRoute,
  investmentPackageRoute,
  newsRoute,
  paymentRoute,
  regionRoute,
  templateRoute,
  userRoute,
} from './search-route.util';

describe('search-route.util', () => {
  it('opens users and payments on their full detail pages', () => {
    expect(userRoute('u1')).toEqual({ commands: ['/users', 'u1'] });
    expect(paymentRoute('p1')).toEqual({ commands: ['/payments', 'p1'] });
  });

  it('opens split-pane records via ?id= on their list page', () => {
    expect(farmPlotRoute('f1')).toEqual({ commands: ['/farm-plots'], queryParams: { id: 'f1' } });
    expect(newsRoute('n1')).toEqual({ commands: ['/system-config/news'], queryParams: { id: 'n1' } });
    expect(galleryRoute('g1')).toEqual({ commands: ['/system-config/gallery'], queryParams: { id: 'g1' } });
    expect(regionRoute('r1')).toEqual({ commands: ['/system-config/regions'], queryParams: { id: 'r1' } });
    expect(bankAccountRoute('b1')).toEqual({ commands: ['/payment-config/bank-accounts'], queryParams: { id: 'b1' } });
  });

  it('routes a template to the page for its own type', () => {
    expect(templateRoute('t1', 'EMAIL')).toEqual({ commands: ['/templates', 'email'], queryParams: { id: 't1' } });
    expect(templateRoute('t2', 'SMS').commands).toEqual(['/templates', 'sms']);
    expect(templateRoute('t3', 'CONTRACT').commands).toEqual(['/templates', 'contract']);
  });

  describe('investmentPackageRoute', () => {
    it('defaults to the published tab', () => {
      expect(investmentPackageRoute('p1', 'IN_USE')).toEqual({
        commands: ['/investment-package'],
        queryParams: { id: 'p1' },
      });
      expect(investmentPackageRoute('p1')).toEqual({ commands: ['/investment-package'], queryParams: { id: 'p1' } });
    });

    it('adds tab=archived for INACTIVE and COMPLITED packages', () => {
      expect(investmentPackageRoute('p1', 'INACTIVE').queryParams).toEqual({ id: 'p1', tab: 'archived' });
      expect(investmentPackageRoute('p1', 'COMPLITED').queryParams).toEqual({ id: 'p1', tab: 'archived' });
    });

    it('adds the detail-panel tab when one is requested', () => {
      expect(investmentPackageRoute('p1', null, 'contract').queryParams).toEqual({ id: 'p1', panel: 'contract' });
      expect(investmentPackageRoute('p1', 'COMPLITED', 'follow-up').queryParams)
        .toEqual({ id: 'p1', tab: 'archived', panel: 'follow-up' });
    });
  });
});
