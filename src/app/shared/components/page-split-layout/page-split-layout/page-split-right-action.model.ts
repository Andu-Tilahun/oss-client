import type {ActionIconType} from '../../action-icons/action-icon-button/action-icon-button.component';

/**
 * Declarative actions for the right column of {@link PageSplitLayoutComponent},
 * similar in spirit to {@link DataTableColumn} row actions.
 */
export interface PageSplitRightAction<T = unknown> {
  id: string;
  icon: ActionIconType;
  title?: string;
  /** If omitted, the action is shown whenever `rightItem` is set. */
  visible?: (item: T) => boolean;
  disabled?: (item: T) => boolean;
  buttonClass?: string;
  svgClass?: string;
  action: (item: T) => void;
}
