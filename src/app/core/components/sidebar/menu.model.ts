export interface MenuItem {
  icon: string;
  label: string;
  route: string;
  roles?: string[];
  children?: MenuItem[];
  expanded?: boolean;
}
