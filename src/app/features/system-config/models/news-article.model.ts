export type NewsStatus = 'DRAFT' | 'PUBLISHED';

export interface NewsArticle {
  id: string;
  title: string;
  summary?: string;
  content?: string;
  category?: string;
  imageUuid?: string;
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
  imageUuid?: string;
  publishedAt?: string;
  status: NewsStatus;
}

export interface NewsPage {
  content: NewsArticle[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
