import { GalleryMediaKind } from './gallery-item.model';

export type NewsStatus = 'DRAFT' | 'PUBLISHED';

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
  createdAt?: string;
  updatedAt?: string;
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
}

export interface NewsArticleFilterRequest {
  searchText?: string;
  status?: NewsStatus;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}
