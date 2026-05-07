import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {environment} from '../../../environments/environment';

type PublicNavPage = 'home' | 'about' | 'contact';

@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './public-header.component.html',
  styleUrl: './public-header.component.css',
})
export class PublicHeaderComponent {
  @Input() activePage: PublicNavPage = 'home';

  async downloadAndroidApp(event: Event): Promise<void> {
    event.preventDefault();

    const releaseApiUrl = `https://api.github.com/repos/${environment.androidAppGithubRepo}/releases/latest`;
    const response = await fetch(releaseApiUrl);
    if (!response.ok) {
      return;
    }

    const release = await response.json();
    const assets = Array.isArray(release?.assets) ? release.assets : [];
    const apkAsset = assets.find((asset: {name?: string}) => asset.name?.toLowerCase().endsWith('.apk'));
    const downloadUrl = apkAsset?.browser_download_url ?? assets[0]?.browser_download_url;
    const version = typeof release?.tag_name === 'string' ? release.tag_name : 'latest';
    const sanitizedVersion = version.replace(/[^a-zA-Z0-9._-]/g, '-');

    if (!downloadUrl) {
      return;
    }

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.rel = 'noopener noreferrer';
    link.download = `oss-${sanitizedVersion}.apk`;
    link.click();
  }
}

