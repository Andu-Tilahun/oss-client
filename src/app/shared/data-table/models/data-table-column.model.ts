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
  defaultValue?: any;
  disabled?: boolean;
  /** When false, column hidden on initial load (default true if omitted). */
  defaultVisible?: boolean;
  /** Hide this column when viewport width is below this value (px). */
  hiddenBelowPx?: number;
  /** Tailwind classes applied to the inner span in the default (text) cell renderer. */
  cellClass?: string;
}
