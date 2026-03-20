export type StatCardVariant = 'default' | 'blue' | 'green' | 'purple' | 'indigo' | 'red' | 'yellow' | 'orange';

export interface StatCardConfig {
  label: string;
  value: string | number;
  variant?: StatCardVariant;
  /** Optional SVG path string for an icon */
  iconPath?: string;
  /** Optional suffix after the value e.g. "seats", "%" */
  suffix?: string;
}
