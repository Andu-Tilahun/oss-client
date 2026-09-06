import { describe, it, expect } from 'vitest';
import { SocialIconComponent, SOCIAL_BRAND_COLORS } from './social-icon.component';
import { SocialMediaPlatform } from '../../../features/system-config/models/social-media.model';

const ALL_PLATFORMS: SocialMediaPlatform[] = [
  'FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'LINKEDIN', 'X', 'TWITTER', 'TELEGRAM', 'WHATSAPP',
];

describe('SocialIconComponent', () => {
  it.each(ALL_PLATFORMS)('renders a non-empty, well-formed SVG path for %s', (platform) => {
    const component = new SocialIconComponent();
    component.platform = platform;

    expect(component.iconPathD.length).toBeGreaterThan(10);
    expect(component.iconPathD.trim().startsWith('M')).toBe(true);
  });

  it.each(ALL_PLATFORMS)('has a distinct brand color entry for %s', (platform) => {
    expect(SOCIAL_BRAND_COLORS[platform]).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('every platform has its own icon path (no accidental duplicates)', () => {
    const component = new SocialIconComponent();
    const paths = ALL_PLATFORMS.map((platform) => {
      component.platform = platform;
      return component.iconPathD;
    });
    expect(new Set(paths).size).toBe(ALL_PLATFORMS.length);
  });
});
