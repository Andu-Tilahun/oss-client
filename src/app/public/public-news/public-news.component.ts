import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PublicNewsItem {
  id: string;
  year: string;
  date: string;
  title: string;
  summary: string;
  excerpt: string;
  body: string;
  category: string;
  imageUrl: string;
  readTime: string;
  source: string;
  externalUrl?: string;
}

@Component({
  selector: 'app-public-news',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './public-news.component.html',
  styleUrl: './public-news.component.css',
})
export class PublicNewsComponent {
  private readonly pageSize = 5;

  readonly allNewsItems: PublicNewsItem[] = [
    {
      id: 'lease-updates',
      year: '2026',
      date: 'May 2026',
      category: 'Leasing',
      title: 'Streamlined farm lease workflows',
      summary: 'Track pending and active farm leases with clearer status updates across the platform.',
      excerpt: 'New lease tracking tools for investors and farm managers.',
      body:
        'AgriVest has rolled out an improved lease workflow that makes it easier to monitor pending agreements, active contracts, and renewal timelines. Investors can review lease status at a glance and take action directly from their dashboard without switching between screens.',
      imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=900&q=80',
      readTime: '3 min read',
      source: 'AgriVest Communications',
    },
    {
      id: 'sustainable-farming',
      year: '2026',
      date: 'Apr 2026',
      category: 'Sustainability',
      title: 'Sustainable farming practices in focus',
      summary: 'Partner farms expand soil-health programs and water-efficient irrigation systems.',
      excerpt: 'Soil-health and irrigation initiatives across partner farms.',
      body:
        'Our partner farms continue to invest in sustainable practices, including cover cropping, reduced chemical inputs, and precision irrigation. These programs support long-term soil fertility while helping investors align with environmentally responsible agricultural outcomes.',
      imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=900&q=80',
      readTime: '4 min read',
      source: 'AgriVest Field Reports',
      externalUrl: 'https://example.com/sustainability',
    },
    {
      id: 'new-plots',
      year: '2026',
      date: 'Apr 2026',
      category: 'Listings',
      title: 'New active plots now available',
      summary: 'Freshly listed farm plots are open for discovery and investment review.',
      excerpt: 'Browse new plots across multiple regions and soil types.',
      body:
        'Several new farm plots have been added to the public marketplace, spanning different sizes, soil types, and regions. Investors can compare opportunities, view plot galleries, and connect with our team to schedule site visits or reserve interest.',
      imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80',
      readTime: '2 min read',
      source: 'AgriVest Listings',
    },
    {
      id: 'investor-onboarding',
      year: '2026',
      date: 'Mar 2026',
      category: 'Investors',
      title: 'Investor onboarding made simpler',
      summary: 'A faster path from sign-up to exploring live farm investment opportunities.',
      excerpt: 'Simplified account setup and guided first steps for new investors.',
      body:
        'We have streamlined the onboarding experience so new investors can create an account, complete their profile, and browse active plots within minutes. Guided prompts and clearer documentation help you understand lease terms, crowdfunding options, and plot discovery tools from day one.',
      imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80',
      readTime: '3 min read',
      source: 'AgriVest Product',
    },
    {
      id: 'harvest-outlook',
      year: '2026',
      date: 'Mar 2026',
      category: 'Operations',
      title: 'Harvest season outlook for partner farms',
      summary: 'Early forecasts point to strong yields across key growing regions this season.',
      excerpt: 'Seasonal outlook and yield expectations from partner farms.',
      body:
        'Field teams report favorable growing conditions across several partner farms, with harvest planning already underway. Investors will receive periodic updates on yield projections, logistics, and post-harvest reporting as the season progresses.',
      imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=900&q=80',
      readTime: '5 min read',
      source: 'AgriVest Operations',
    },
    {
      id: 'crowdfunding-launch',
      year: '2026',
      date: 'Feb 2026',
      category: 'Crowdfunding',
      title: 'New crowdfunding campaigns open',
      summary: 'Investors can review open campaigns and deploy capital into selected farm projects.',
      excerpt: 'Open campaigns now available from the investor dashboard.',
      body:
        'Several crowdfunding campaigns are now live, offering investors the chance to participate in specific farm projects with transparent funding goals and timelines. Review campaign details, expected returns, and funding deadlines before making a commitment.',
      imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=900&q=80',
      readTime: '4 min read',
      source: 'AgriVest Capital',
    },
    {
      id: 'water-management',
      year: '2025',
      date: 'Dec 2025',
      category: 'Sustainability',
      title: 'Water management upgrades completed',
      summary: 'Irrigation infrastructure improvements reduce waste and support consistent crop growth.',
      excerpt: 'Infrastructure upgrades across high-priority farm plots.',
      body:
        'Partner farms have completed a round of irrigation upgrades, including sensor-based scheduling and improved distribution lines. These investments aim to reduce water waste while maintaining reliable crop performance through variable weather conditions.',
      imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=80',
      readTime: '3 min read',
      source: 'AgriVest Field Reports',
    },
    {
      id: 'mobile-app',
      year: '2025',
      date: 'Nov 2025',
      category: 'Product',
      title: 'Mobile app now available for investors',
      summary: 'Manage leases, browse plots, and track investments on the go with the AgriVest app.',
      excerpt: 'Download the Android app from the public site header.',
      body:
        'The AgriVest mobile application is now available for Android devices, giving investors quick access to plot discovery, lease status, and notifications. Download the app from the link in the site header and sign in with your existing account credentials.',
      imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80',
      readTime: '2 min read',
      source: 'AgriVest Product',
    },
    {
      id: 'partnership-expansion',
      year: '2025',
      date: 'Oct 2025',
      category: 'Partnerships',
      title: 'Partnership network continues to expand',
      summary: 'New farm operators join the platform, broadening regional coverage for investors.',
      excerpt: 'Additional partner farms onboarded in Q4.',
      body:
        'AgriVest welcomes new partner farm operators across additional regions, expanding the range of plots and investment styles available on the platform. Each partner undergoes a review process to ensure transparency, operational standards, and alignment with investor expectations.',
      imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=900&q=80',
      readTime: '4 min read',
      source: 'AgriVest Communications',
    },
    {
      id: 'annual-review',
      year: '2025',
      date: 'Sep 2025',
      category: 'Investors',
      title: 'Annual investor review published',
      summary: 'A summary of platform growth, farm performance, and goals for the coming year.',
      excerpt: 'Year-in-review highlights for the AgriVest community.',
      body:
        'Our annual review highlights key milestones from the past year, including plot listings, lease activity, crowdfunding participation, and sustainability initiatives. Investors can use this overview to understand platform direction and upcoming feature releases.',
      imageUrl: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=900&q=80',
      readTime: '6 min read',
      source: 'AgriVest Leadership',
      externalUrl: 'https://example.com/annual-review',
    },
  ];

  sidebarPage = 0;
  activeItemIndex = 0;
  bodyExpanded = false;

  get sidebarItems(): PublicNewsItem[] {
    const start = this.sidebarPage * this.pageSize;
    return this.allNewsItems.slice(start, start + this.pageSize);
  }

  get activeItem(): PublicNewsItem {
    return this.allNewsItems[this.activeItemIndex];
  }

  get totalSidebarPages(): number {
    return Math.ceil(this.allNewsItems.length / this.pageSize);
  }

  selectItem(item: PublicNewsItem): void {
    this.activeItemIndex = this.allNewsItems.findIndex((n) => n.id === item.id);
    this.bodyExpanded = false;
  }

  showNextNews(): void {
    this.sidebarPage = (this.sidebarPage + 1) % this.totalSidebarPages;

    const firstItem = this.sidebarItems[0];
    if (firstItem) {
      this.selectItem(firstItem);
    }
  }

  toggleBodyExpanded(): void {
    this.bodyExpanded = !this.bodyExpanded;
  }
}
