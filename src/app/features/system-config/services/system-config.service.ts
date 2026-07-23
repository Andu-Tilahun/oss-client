import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { HttpService } from '../../../core/services/http.service';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { Endpoints } from '../../../core/endpoint/endpoint.model';
import { OrganizationConfig, OrganizationConfigRequest } from '../models/organization-config.model';
import { NewsArticle, NewsArticleRequest, NewsPage } from '../models/news-article.model';
import { SocialMediaLink, SocialMediaLinkRequest } from '../models/social-media.model';
import { BranchCenter, BranchCenterRequest } from '../models/branch-center.model';
import { MessageTemplate, MessageTemplateRequest, TemplateType } from '../models/message-template.model';
import { BankAccount, BankAccountRequest } from '../models/bank-account.model';

@Injectable({ providedIn: 'root' })
export class SystemConfigService {
  constructor(private http: HttpService) {}

  // Organization
  getOrganizationConfig(): Observable<OrganizationConfig> {
    return this.http.get<OrganizationConfig>(Endpoints.CONFIG_ORGANIZATION_ENDPOINT);
  }

  updateOrganizationConfig(request: OrganizationConfigRequest): Observable<ApiResponse<OrganizationConfig>> {
    return this.http.put<ApiResponse<OrganizationConfig>>(Endpoints.CONFIG_ORGANIZATION_ENDPOINT, request);
  }

  // News – public
  getPublishedNews(page = 0, size = 20): Observable<NewsPage> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<NewsPage>(Endpoints.CONFIG_NEWS_ENDPOINT, undefined, params);
  }

  // News – admin
  getAllNews(page = 0, size = 20): Observable<NewsPage> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<NewsPage>(`${Endpoints.CONFIG_NEWS_ENDPOINT}/admin`, undefined, params);
  }

  getNewsById(id: string): Observable<NewsArticle> {
    return this.http.get<NewsArticle>(`${Endpoints.CONFIG_NEWS_ENDPOINT}/${id}`);
  }

  createNews(request: NewsArticleRequest): Observable<ApiResponse<NewsArticle>> {
    return this.http.post<ApiResponse<NewsArticle>>(Endpoints.CONFIG_NEWS_ENDPOINT, request);
  }

  updateNews(id: string, request: NewsArticleRequest): Observable<ApiResponse<NewsArticle>> {
    return this.http.put<ApiResponse<NewsArticle>>(`${Endpoints.CONFIG_NEWS_ENDPOINT}/${id}`, request);
  }

  deleteNews(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${Endpoints.CONFIG_NEWS_ENDPOINT}/${id}`);
  }

  // Social media – public
  getVisibleSocialMedia(): Observable<SocialMediaLink[]> {
    return this.http.get<SocialMediaLink[]>(Endpoints.CONFIG_SOCIAL_MEDIA_ENDPOINT);
  }

  // Social media – admin
  getAllSocialMedia(): Observable<SocialMediaLink[]> {
    return this.http.get<SocialMediaLink[]>(`${Endpoints.CONFIG_SOCIAL_MEDIA_ENDPOINT}/all`);
  }

  createSocialMedia(request: SocialMediaLinkRequest): Observable<ApiResponse<SocialMediaLink>> {
    return this.http.post<ApiResponse<SocialMediaLink>>(Endpoints.CONFIG_SOCIAL_MEDIA_ENDPOINT, request);
  }

  updateSocialMedia(id: string, request: SocialMediaLinkRequest): Observable<ApiResponse<SocialMediaLink>> {
    return this.http.put<ApiResponse<SocialMediaLink>>(`${Endpoints.CONFIG_SOCIAL_MEDIA_ENDPOINT}/${id}`, request);
  }

  deleteSocialMedia(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${Endpoints.CONFIG_SOCIAL_MEDIA_ENDPOINT}/${id}`);
  }

  // Branch centers – public
  getBranchCenters(): Observable<BranchCenter[]> {
    return this.http.get<BranchCenter[]>(Endpoints.CONFIG_BRANCH_CENTERS_ENDPOINT);
  }

  // Branch centers – admin
  createBranchCenter(request: BranchCenterRequest): Observable<ApiResponse<BranchCenter>> {
    return this.http.post<ApiResponse<BranchCenter>>(Endpoints.CONFIG_BRANCH_CENTERS_ENDPOINT, request);
  }

  updateBranchCenter(id: string, request: BranchCenterRequest): Observable<ApiResponse<BranchCenter>> {
    return this.http.put<ApiResponse<BranchCenter>>(`${Endpoints.CONFIG_BRANCH_CENTERS_ENDPOINT}/${id}`, request);
  }

  deleteBranchCenter(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${Endpoints.CONFIG_BRANCH_CENTERS_ENDPOINT}/${id}`);
  }

  // Bank accounts – public (active only, no auth required)
  getActiveBankAccounts(): Observable<BankAccount[]> {
    return this.http.get<BankAccount[]>(Endpoints.CONFIG_BANK_ACCOUNTS_ENDPOINT);
  }

  // Bank accounts – admin
  getAllBankAccounts(): Observable<BankAccount[]> {
    return this.http.get<BankAccount[]>(`${Endpoints.CONFIG_BANK_ACCOUNTS_ENDPOINT}/all`);
  }

  createBankAccount(request: BankAccountRequest): Observable<ApiResponse<BankAccount>> {
    return this.http.post<ApiResponse<BankAccount>>(Endpoints.CONFIG_BANK_ACCOUNTS_ENDPOINT, request);
  }

  updateBankAccount(id: string, request: BankAccountRequest): Observable<ApiResponse<BankAccount>> {
    return this.http.put<ApiResponse<BankAccount>>(`${Endpoints.CONFIG_BANK_ACCOUNTS_ENDPOINT}/${id}`, request);
  }

  deleteBankAccount(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${Endpoints.CONFIG_BANK_ACCOUNTS_ENDPOINT}/${id}`);
  }

  // Templates
  getTemplates(type?: TemplateType): Observable<MessageTemplate[]> {
    const params = type ? new HttpParams().set('type', type) : undefined;
    return this.http.get<MessageTemplate[]>(Endpoints.CONFIG_TEMPLATES_ENDPOINT, undefined, params);
  }

  getTemplateById(id: string): Observable<MessageTemplate> {
    return this.http.get<MessageTemplate>(`${Endpoints.CONFIG_TEMPLATES_ENDPOINT}/${id}`);
  }

  createTemplate(request: MessageTemplateRequest): Observable<ApiResponse<MessageTemplate>> {
    return this.http.post<ApiResponse<MessageTemplate>>(Endpoints.CONFIG_TEMPLATES_ENDPOINT, request);
  }

  updateTemplate(id: string, request: MessageTemplateRequest): Observable<ApiResponse<MessageTemplate>> {
    return this.http.put<ApiResponse<MessageTemplate>>(`${Endpoints.CONFIG_TEMPLATES_ENDPOINT}/${id}`, request);
  }

  deleteTemplate(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${Endpoints.CONFIG_TEMPLATES_ENDPOINT}/${id}`);
  }
}
