import { ColumnType } from './column-types.model';

export interface DataTableColumn<T> {
  header: string;
  columnType?: ColumnType;
  value?: (item: T) => any;
  /** Alt text for IMAGE column type. */
  imageAlt?: (item: T) => string;
  columnAction?: (item: T) => void;
  /** When false, BUTTON column renders label as plain text instead of a clickable button. */
  actionable?: (item: T) => boolean;
  defaultValue?: boolean | ((item: T) => boolean);
  disabled?: boolean | ((item: T) => boolean);
  /** When false, column hidden on initial load (default true if omitted). */
  defaultVisible?: boolean;
  /** Hide this column when viewport width is below this value (px). */
  hiddenBelowPx?: number;
  /** Tailwind classes applied to the inner span in the default (text) cell renderer. Accepts a per-row function for conditional styling (e.g. status pills). */
  cellClass?: string | ((item: T) => string);
  /** For IMAGE columns only: render a muted <video> instead of <img> for rows whose media is a video. */
  mediaKind?: (item: T) => 'image' | 'video';
  /** Max width (px) for automatic truncation in the default TEXT cell. Default: 320. */
  maxCellWidth?: number;
  /** Optional small corner-icon overlay for the default TEXT cell (e.g. a status dot on a title).
   *  Absolutely positioned over the cell's text — consumes no row/column space. */
  cornerBadge?: (item: T) => { colorClass: string; title?: string; icon?: 'check' | 'dot' } | null;
}
