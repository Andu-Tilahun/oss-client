import { GalleryMediaKind } from './gallery-item.model';

export type NewsStatus = 'DRAFT' | 'PUBLISHED' | 'INACTIVE';
export type NewsAudience = 'PUBLIC' | 'INVESTOR' | 'EXTENSION_WORKER';

export interface NewsArticleMediaItem {
  id: string;
  mediaUuid: string;
  kind: GalleryMediaKind;
  sortOrder: number;
}

export interface NewsArticleMediaRequest {
  mediaUuid: string;
  kind: GalleryMediaKind;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  category?: string;
  mediaUuid?: string;
  kind?: GalleryMediaKind;
  publishedAt?: string;
  status: NewsStatus;
  audience: NewsAudience;
  createdAt?: string;
  updatedAt?: string;
  media?: NewsArticleMediaItem[];
}

export interface NewsArticleRequest {
  title: string;
  summary?: string;
  content?: string;
  category?: string;
  mediaUuid?: string;
  kind?: GalleryMediaKind;
  publishedAt?: string;
  status: NewsStatus;
  audience: NewsAudience;
}

export interface NewsArticleFilterRequest {
  searchText?: string;
  status?: NewsStatus;
  audience?: NewsAudience;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}
