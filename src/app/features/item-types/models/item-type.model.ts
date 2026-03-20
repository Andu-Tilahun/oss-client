export interface ItemType {
  id: string;
  name: string;
  category?: string;
  gateTracked?: boolean;
}

export interface ItemTypeRequest {
  name: string;
  category?: string;
  gateTracked?: boolean;
}
