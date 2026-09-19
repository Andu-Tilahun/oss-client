import { Params } from '@angular/router';

export type SearchResultType =
  | 'user'
  | 'farm-plot'
  | 'investment-package'
  | 'agreement'
  | 'investor-record'
  | 'follow-up'
  | 'payment'
  | 'news'
  | 'gallery'
  | 'region'
  | 'template'
  | 'bank-account';

export const SEARCH_TYPE_LABELS: Record<SearchResultType, string> = {
  'user': 'User',
  'farm-plot': 'Farm Plot',
  'investment-package': 'Investment Package',
  'agreement': 'Agreement',
  'investor-record': 'Investor Record',
  'follow-up': 'Follow-up',
  'payment': 'Payment',
  'news': 'News',
  'gallery': 'Gallery',
  'region': 'Region',
  'template': 'Template',
  'bank-account': 'Bank Account',
};

export interface SearchRoute {
  commands: any[];
  queryParams?: Params;
}

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description: string;
  tags: string[];
  route: SearchRoute;
}

export const SEARCH_PAGE_SIZE = 20;

/** One page of a single record type's matches, plus how many matches exist in total. */
export interface SearchPage {
  results: SearchResult[];
  total: number;
}

export interface SearchOutcome {
  /** First page (up to SEARCH_PAGE_SIZE) of every type, in type order. */
  results: SearchResult[];
  /** Real number of matches per type (types that failed are absent). */
  totals: Partial<Record<SearchResultType, number>>;
  failedTypes: SearchResultType[];
}
