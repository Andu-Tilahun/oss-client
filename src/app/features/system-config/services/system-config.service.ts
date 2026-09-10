import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { HttpService, RequestType } from '../../../core/services/http.service';
import { ApiResponse, PageResponse } from '../../../shared/models/api-response.model';
import { Endpoints } from '../../../core/endpoint/endpoint.model';
import { OrganizationAboutRequest, OrganizationBasicInfoRequest, OrganizationConfig, OrganizationConfigRequest, OrganizationContactRequest } from '../models/organization-config.model';
import { NewsArticle, NewsArticleFilterRequest, NewsArticleMediaItem, NewsArticleMediaRequest, NewsArticleRequest } from '../models/news-article.model';
import { SocialMediaLink, SocialMediaLinkFilterRequest, SocialMediaLinkRequest } from '../models/social-media.model';
import { BranchCenter, BranchCenterRequest } from '../models/branch-center.model';
import { MessageTemplate, MessageTemplateRequest, TemplateType } from '../models/message-template.model';
import { BankAccount, BankAccountRequest } from '../models/bank-account.model';
import { GalleryItem, GalleryItemFilterRequest, GalleryItemRequest } from '../models/gallery-item.model';

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

  updateOrganizationBasicInfo(request: OrganizationBasicInfoRequest): Observable<ApiResponse<OrganizationConfig>> {
    return this.http.patch<ApiResponse<OrganizationConfig>>(`${Endpoints.CONFIG_ORGANIZATION_ENDPOINT}/basic-info`, request);
  }

  updateOrganizationContact(request: OrganizationContactRequest): Observable<ApiResponse<OrganizationConfig>> {
    return this.http.patch<ApiResponse<OrganizationConfig>>(`${Endpoints.CONFIG_ORGANIZATION_ENDPOINT}/contact`, request);
  }

  updateOrganizationAboutUs(request: OrganizationAboutRequest): Observable<ApiResponse<OrganizationConfig>> {
    return this.http.patch<ApiResponse<OrganizationConfig>>(`${Endpoints.CONFIG_ORGANIZATION_ENDPOINT}/about`, request);
  }

  // News – public
  getPublishedNews(page = 0, size = 20): Observable<PageResponse<NewsArticle>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<NewsArticle>>(Endpoints.CONFIG_NEWS_ENDPOINT, undefined, params);
  }

  // News – portal (authenticated: public + caller's role-specific audience)
  getPortalNews(page = 0, size = 20): Observable<PageResponse<NewsArticle>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<PageResponse<NewsArticle>>(`${Endpoints.CONFIG_NEWS_ENDPOINT}/portal`, undefined, params);
  }

  // News – admin
  filterNews(request: NewsArticleFilterRequest): Observable<PageResponse<NewsArticle>> {
    return this.http.post<PageResponse<NewsArticle>>(`${Endpoints.CONFIG_NEWS_ENDPOINT}/admin/filter`, request);
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

  deactivateNews(id: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${Endpoints.CONFIG_NEWS_ENDPOINT}/${id}/deactivate`, {});
  }

  addNewsMedia(articleId: string, request: NewsArticleMediaRequest): Observable<NewsArticleMediaItem> {
    return this.http.post<NewsArticleMediaItem>(`${Endpoints.CONFIG_NEWS_ENDPOINT}/${articleId}/media`, request);
  }

  deleteNewsMedia(articleId: string, mediaId: string): Observable<void> {
    return this.http.delete<void>(`${Endpoints.CONFIG_NEWS_ENDPOINT}/${articleId}/media/${mediaId}`);
  }

  // Social media – public
  getVisibleSocialMedia(): Observable<SocialMediaLink[]> {
    return this.http.get<SocialMediaLink[]>(Endpoints.CONFIG_SOCIAL_MEDIA_ENDPOINT);
  }

  // Social media – admin
  filterSocialMedia(request: SocialMediaLinkFilterRequest): Observable<PageResponse<SocialMediaLink>> {
    return this.http.post<PageResponse<SocialMediaLink>>(`${Endpoints.CONFIG_SOCIAL_MEDIA_ENDPOINT}/admin/filter`, request);
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
    return this.http.get<BankAccount[]>(
      `${Endpoints.CONFIG_BANK_ACCOUNTS_ENDPOINT}/all`, undefined, undefined, { requestType: RequestType.LOCAL }
    );
  }

  createBankAccount(request: BankAccountRequest): Observable<ApiResponse<BankAccount>> {
    return this.http.post<ApiResponse<BankAccount>>(
      Endpoints.CONFIG_BANK_ACCOUNTS_ENDPOINT, request, undefined, { requestType: RequestType.LOCAL }
    );
  }

  updateBankAccount(id: string, request: BankAccountRequest): Observable<ApiResponse<BankAccount>> {
    return this.http.put<ApiResponse<BankAccount>>(
      `${Endpoints.CONFIG_BANK_ACCOUNTS_ENDPOINT}/${id}`, request, undefined, { requestType: RequestType.LOCAL }
    );
  }

  deleteBankAccount(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${Endpoints.CONFIG_BANK_ACCOUNTS_ENDPOINT}/${id}`, undefined, { requestType: RequestType.LOCAL }
    );
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

  // Gallery – public
  getVisibleGalleryItems(): Observable<GalleryItem[]> {
    return this.http.get<GalleryItem[]>(Endpoints.CONFIG_GALLERY_ENDPOINT);
  }

  // Gallery – admin
  filterGalleryItems(request: GalleryItemFilterRequest): Observable<PageResponse<GalleryItem>> {
    return this.http.post<PageResponse<GalleryItem>>(`${Endpoints.CONFIG_GALLERY_ENDPOINT}/admin/filter`, request);
  }

  createGalleryItem(request: GalleryItemRequest): Observable<ApiResponse<GalleryItem>> {
    return this.http.post<ApiResponse<GalleryItem>>(Endpoints.CONFIG_GALLERY_ENDPOINT, request);
  }

  updateGalleryItem(id: string, request: GalleryItemRequest): Observable<ApiResponse<GalleryItem>> {
    return this.http.put<ApiResponse<GalleryItem>>(`${Endpoints.CONFIG_GALLERY_ENDPOINT}/${id}`, request);
  }

  deleteGalleryItem(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${Endpoints.CONFIG_GALLERY_ENDPOINT}/${id}`);
  }
}
