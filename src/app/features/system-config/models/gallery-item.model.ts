export type GalleryMediaKind = 'IMAGE' | 'VIDEO';

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  mediaUuid: string;
  kind: GalleryMediaKind;
  visible: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GalleryItemRequest {
  title: string;
  description: string;
  mediaUuid: string;
  kind: GalleryMediaKind;
  visible: boolean;
}

export interface GalleryItemFilterRequest {
  searchText?: string;
  kind?: GalleryMediaKind;
  visible?: boolean;
  sortBy?: string;
  sortDirection?: 'ASC' | 'DESC';
  page: number;
  size: number;
}
