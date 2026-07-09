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
