export type SocialMediaPlatform =
  | 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE'
  | 'LINKEDIN' | 'X' | 'TWITTER' | 'TELEGRAM' | 'WHATSAPP';

export interface SocialMediaLink {
  id: string;
  platform: SocialMediaPlatform;
  url: string;
  visible: boolean;
  displayOrder: number;
}

export interface SocialMediaLinkRequest {
  platform: SocialMediaPlatform;
  url: string;
  visible: boolean;
  displayOrder: number;
}

export interface SocialMediaLinkFilterRequest {
  searchText?: string;
  platform?: SocialMediaPlatform;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}
