export interface TabItem {
  /** Unique key used to identify the active tab */
  key: string;
  /** Display label */
  label: string;
  /** Optional SVG path(s) for an icon rendered before the label */
  iconPath?: string | string[];
}
