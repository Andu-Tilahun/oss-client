import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { HttpService, RequestOption, RequestType } from '../../../core/services/http.service';
import { Endpoints } from '../../../core/endpoint/endpoint.model';
import { PageResponse } from '../../../shared/models/api-response.model';
import { User } from '../../users/models/user.model';
import { FarmPlot } from '../../farm-plots/models/farm-plot.model';
import {
  InvestmentAgreement,
  InvestmentPackage,
  InvestmentRecord,
} from '../../investment-package/models/investment-package.model';
import { FarmFollowUp } from '../../farm-followups/models/farm-followup.model';
import { PaymentDetail } from '../../payments/models/payment.model';
import { Region } from '../../regions/models/region.model';
import { NewsArticle } from '../../system-config/models/news-article.model';
import { GalleryItem } from '../../system-config/models/gallery-item.model';
import { MessageTemplate } from '../../system-config/models/message-template.model';
import { BankAccount } from '../../system-config/models/bank-account.model';
import { SEARCH_PAGE_SIZE, SearchOutcome, SearchPage, SearchResult, SearchResultType } from '../models/search-result.model';
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
} from '../utils/search-route.util';

export const MIN_QUERY_LENGTH = 2;
const CACHE_TTL_MS = 60_000;

/**
 * Fan-out searches must fail quietly: NON_BLOCKING suppresses the global spinner and error toast,
 * and skipAuthRedirect stops a 403 from one service force-logging-out the admin mid-search.
 */
const QUIET: RequestOption = { requestType: RequestType.NON_BLOCKING, skipAuthRedirect: true };

/** Searches one record type; `page` is zero-based. */
type Provider = (query: string, page: number, size: number) => Observable<SearchPage>;

function contains(value: unknown, needle: string): boolean {
  return typeof value === 'string' && value.toLowerCase().includes(needle);
}

function truncate(value: string | null | undefined, max = 110): string {
  const text = (value ?? '').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function present(...tags: Array<string | null | undefined | false>): string[] {
  return tags.filter((tag): tag is string => !!tag);
}

function fullName(user?: User | null): string {
  return user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username : '';
}

function maskAccountNumber(accountNumber: string): string {
  const digits = (accountNumber ?? '').trim();
  return digits.length > 4 ? `•••• ${digits.slice(-4)}` : '••••';
}

@Injectable({ providedIn: 'root' })
export class GlobalSearchService {
  private readonly cache = new Map<string, { at: number; data$: Observable<unknown> }>();

  constructor(private http: HttpService) {}

  /** First page of every record type, in parallel. */
  search(query: string): Observable<SearchOutcome> {
    const q = query.trim();
    if (q.length < MIN_QUERY_LENGTH) {
      return of({ results: [], totals: {}, failedTypes: [] });
    }

    const jobs = this.providerEntries().map(([type, run]) =>
      run(q, 0, SEARCH_PAGE_SIZE).pipe(
        map(page => ({ type, page, failed: false })),
        catchError(() => of({ type, page: { results: [], total: 0 } as SearchPage, failed: true })),
      ),
    );

    return forkJoin(jobs).pipe(
      map(outcomes => ({
        results: outcomes.flatMap(o => o.page.results),
        totals: Object.fromEntries(outcomes.filter(o => !o.failed).map(o => [o.type, o.page.total])),
        failedTypes: outcomes.filter(o => o.failed).map(o => o.type),
      })),
    );
  }

  /** One page (zero-based) of a single record type, for the per-type paginated view. */
  searchType(query: string, type: SearchResultType, page: number, size = SEARCH_PAGE_SIZE): Observable<SearchPage> {
    return this.providerMap()[type](query.trim(), page, size);
  }

  private providerEntries(): Array<[SearchResultType, Provider]> {
    return Object.entries(this.providerMap()) as Array<[SearchResultType, Provider]>;
  }

  private providerMap(): Record<SearchResultType, Provider> {
    return {
      'user': (q, page, size) => this.users(q, page, size),
      'farm-plot': (q, page, size) => this.farmPlots(q, page, size),
      'investment-package': (q, page, size) => this.investmentPackages(q, page, size),
      'agreement': (q, page, size) => this.agreements(q, page, size),
      'investor-record': (q, page, size) => this.investorRecords(q, page, size),
      'follow-up': (q, page, size) => this.followUps(q.toLowerCase(), page, size),
      'payment': (q, page, size) => this.payments(q, page, size),
      'news': (q, page, size) => this.news(q, page, size),
      'gallery': (q, page, size) => this.gallery(q, page, size),
      'region': (q, page, size) => this.regions(q, page, size),
      'template': (q, page, size) => this.templates(q.toLowerCase(), page, size),
      'bank-account': (q, page, size) => this.bankAccounts(q.toLowerCase(), page, size),
    };
  }

  private paged<T>(response: PageResponse<T>, toResult: (item: T) => SearchResult): SearchPage {
    return { results: (response.content ?? []).map(toResult), total: response.totalElements ?? 0 };
  }

  /** Pages an already-filtered in-memory list (the unpaged endpoints have no server-side paging). */
  private sliced<T>(items: T[], page: number, size: number, toResult: (item: T) => SearchResult): SearchPage {
    const start = page * size;
    return { results: items.slice(start, start + size).map(toResult), total: items.length };
  }

  /** Small unpaged lists with no text filter: fetched once per minute, then filtered in the browser. */
  private cached<T>(key: string, factory: () => Observable<T>): Observable<T> {
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return hit.data$ as Observable<T>;
    }
    const data$ = factory().pipe(
      catchError(error => {
        this.cache.delete(key);
        throw error;
      }),
      shareReplay(1),
    );
    this.cache.set(key, { at: Date.now(), data$ });
    return data$;
  }

  private users(searchText: string, page: number, size: number): Observable<SearchPage> {
    return this.http
      .post<PageResponse<User>>(`${Endpoints.USERS_ENDPOINT}/filter`, { searchText, page, size }, undefined, QUIET)
      .pipe(map(res => this.paged(res, user => ({
        id: user.id,
        type: 'user' as const,
        title: fullName(user),
        description: present(user.email, user.username && `@${user.username}`).join(' · '),
        tags: present(user.role),
        route: userRoute(user.id),
      }))));
  }

  private farmPlots(searchText: string, page: number, size: number): Observable<SearchPage> {
    return this.http
      .post<PageResponse<FarmPlot>>(`${Endpoints.FARM_PLOTS_ENDPOINT}/filter`, { searchText, page, size }, undefined, QUIET)
      .pipe(map(res => this.paged(res, plot => ({
        id: plot.id,
        type: 'farm-plot' as const,
        title: plot.title,
        description: truncate(plot.description) || `${plot.size} ${plot.sizeType}`,
        tags: present(plot.status, plot.soilType),
        route: farmPlotRoute(plot.id),
      }))));
  }

  private investmentPackages(searchText: string, page: number, size: number): Observable<SearchPage> {
    return this.http
      .put<PageResponse<InvestmentPackage>>(`${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/filter`, { searchText, page, size }, undefined, QUIET)
      .pipe(map(res => this.paged(res, pkg => ({
        id: pkg.id,
        type: 'investment-package' as const,
        title: pkg.title,
        description: truncate(pkg.description) || 'Investment package',
        tags: present(pkg.investmentPackageType, pkg.packageStatus, pkg.fundingStatus),
        route: investmentPackageRoute(pkg.id, pkg.packageStatus),
      }))));
  }

  private agreements(searchText: string, page: number, size: number): Observable<SearchPage> {
    return this.http
      .post<PageResponse<InvestmentAgreement>>(`${Endpoints.INVESTMENT_AGGREMENT_ENDPOINT}/filter`, { searchText, page, size }, undefined, QUIET)
      .pipe(map(res => this.paged(res, agreement => ({
        id: agreement.id,
        type: 'agreement' as const,
        title: `Agreement · ${agreement.farmPlot?.title ?? 'Farm plot'}`,
        description: present(
          agreement.totalAmount != null && `Amount ${agreement.totalAmount}`,
          agreement.startDate && agreement.endDate && `${agreement.startDate} → ${agreement.endDate}`,
        ).join(' · '),
        tags: present(agreement.status, agreement.investmentPackageType),
        route: investmentPackageRoute(agreement.investmentPackageId, null, 'contract'),
      }))));
  }

  private investorRecords(searchText: string, page: number, size: number): Observable<SearchPage> {
    return this.http
      .put<PageResponse<InvestmentRecord>>(`${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/investmentRecord/filter`, { searchText, page, size }, undefined, QUIET)
      .pipe(map(res => this.paged(res, record => ({
        id: record.id,
        type: 'investor-record' as const,
        title: present(record.investmentPackage?.title ?? 'Investment', fullName(record.investorUser)).join(' · '),
        description: present(`Amount ${record.amount}`, record.paymentReference && `Ref ${record.paymentReference}`).join(' · '),
        tags: present(record.status, record.paymentStatus),
        route: investmentPackageRoute(record.investmentPackageId, record.investmentPackage?.packageStatus, 'investor'),
      }))));
  }

  private followUps(needle: string, page: number, size: number): Observable<SearchPage> {
    return this.cached('follow-ups', () =>
      this.http.get<FarmFollowUp[]>(`${Endpoints.FARM_FOLLOWUPS_ENDPOINT}/admin`, undefined, undefined, QUIET),
    ).pipe(map(list => this.sliced(
      (list ?? []).filter(f => contains(f.referenceNumber, needle) || contains(f.remark, needle) || contains(f.outcomeReason, needle)),
      page,
      size,
      f => ({
        id: f.id,
        type: 'follow-up' as const,
        title: f.referenceNumber,
        description: truncate(f.remark) || truncate(f.outcomeReason) || 'Follow-up task',
        tags: present(f.taskStatus),
        route: investmentPackageRoute(f.externalId, null, 'follow-up'),
      }),
    )));
  }

  private payments(search: string, page: number, size: number): Observable<SearchPage> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size)).set('search', search);
    return this.http
      .get<PageResponse<PaymentDetail>>(Endpoints.PAYMENTS_ENDPOINT, undefined, params, QUIET)
      .pipe(map(res => this.paged(res, payment => ({
        id: payment.id,
        type: 'payment' as const,
        title: `${payment.orderNumber}${payment.fullName ? ` · ${payment.fullName}` : ''}`,
        description: present(payment.email, payment.utility, `Amount ${payment.amount}`).join(' · '),
        tags: present(payment.paymentDetailStatus),
        route: paymentRoute(payment.id),
      }))));
  }

  private news(searchText: string, page: number, size: number): Observable<SearchPage> {
    return this.http
      .post<PageResponse<NewsArticle>>(`${Endpoints.CONFIG_NEWS_ENDPOINT}/admin/filter`, { searchText, page, size }, undefined, QUIET)
      .pipe(map(res => this.paged(res, article => ({
        id: article.id,
        type: 'news' as const,
        title: article.title,
        description: truncate(article.summary) || 'News article',
        tags: present(article.status, article.audience, article.category),
        route: newsRoute(article.id),
      }))));
  }

  private gallery(searchText: string, page: number, size: number): Observable<SearchPage> {
    return this.http
      .post<PageResponse<GalleryItem>>(`${Endpoints.CONFIG_GALLERY_ENDPOINT}/admin/filter`, { searchText, page, size }, undefined, QUIET)
      .pipe(map(res => this.paged(res, item => ({
        id: item.id,
        type: 'gallery' as const,
        title: item.title,
        description: truncate(item.description) || 'Gallery item',
        tags: present(item.kind, item.visible ? 'VISIBLE' : 'HIDDEN'),
        route: galleryRoute(item.id),
      }))));
  }

  private regions(searchText: string, page: number, size: number): Observable<SearchPage> {
    return this.http
      .post<PageResponse<Region>>(`${Endpoints.REGIONS_ENDPOINT}/filter`, { searchText, page, size }, undefined, QUIET)
      .pipe(map(res => this.paged(res, region => ({
        id: region.id,
        type: 'region' as const,
        title: region.name,
        description: 'Farm region',
        tags: [],
        route: regionRoute(region.id),
      }))));
  }

  private templates(needle: string, page: number, size: number): Observable<SearchPage> {
    return this.cached('templates', () =>
      this.http.get<MessageTemplate[]>(Endpoints.CONFIG_TEMPLATES_ENDPOINT, undefined, undefined, QUIET),
    ).pipe(map(list => this.sliced(
      (list ?? []).filter(t => contains(t.name, needle) || contains(t.subject, needle) || contains(t.purpose, needle)),
      page,
      size,
      t => ({
        id: t.id,
        type: 'template' as const,
        title: t.name,
        description: truncate(t.subject) || 'Message template',
        tags: present(t.type, t.purpose, !t.active && 'INACTIVE'),
        route: templateRoute(t.id, t.type),
      }),
    )));
  }

  private bankAccounts(needle: string, page: number, size: number): Observable<SearchPage> {
    return this.cached('bank-accounts', () =>
      this.http.get<BankAccount[]>(`${Endpoints.CONFIG_BANK_ACCOUNTS_ENDPOINT}/all`, undefined, undefined, QUIET),
    ).pipe(map(list => this.sliced(
      (list ?? []).filter(a => contains(a.bankName, needle) || contains(a.accountHolderName, needle)
        || contains(a.branchName, needle) || contains(a.accountNumber, needle)),
      page,
      size,
      a => ({
        id: a.id,
        type: 'bank-account' as const,
        title: a.bankName,
        // Full account numbers are matched on but never displayed in search results.
        description: `${a.accountHolderName} · ${maskAccountNumber(a.accountNumber)}`,
        tags: present(!a.active && 'INACTIVE'),
        route: bankAccountRoute(a.id),
      }),
    )));
  }
}
