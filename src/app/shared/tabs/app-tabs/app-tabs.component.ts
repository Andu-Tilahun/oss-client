import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { TabItem } from '../models/tab-item.model';
import {CommonModule} from "@angular/common";

@Component({
  selector: 'app-tabs',
  standalone:true,
  imports:[CommonModule],
  templateUrl: './app-tabs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent {
  /** List of tab definitions */
  @Input() tabs: TabItem[] = [];

  /** Key of the currently active tab */
  @Input() activeTab = '';

  /** When true, renders tabs as centered pills instead of left-aligned underlines */
  @Input() centered = false;

  /** Emits the key of the tab that was clicked */
  @Output() activeTabChange = new EventEmitter<string>();

  setTab(key: string): void {
    if (key !== this.activeTab) {
      this.activeTab = key;
      this.activeTabChange.emit(key);
    }
  }

  trackByKey(_: number, tab: TabItem): string {
    return tab.key;
  }

  /** Normalise iconPath to always be an array for *ngFor */
  paths(tab: TabItem): string[] {
    if (!tab.iconPath) return [];
    return Array.isArray(tab.iconPath) ? tab.iconPath : [tab.iconPath];
  }

  /**
   * Flex `order` for the (single) projected content panel, so on the mobile/tablet accordion
   * it visually lands directly under the active header. Irrelevant at lg: and up (plain block flow).
   */
  mobileContentOrder(): number {
    const idx = this.tabs.findIndex((t) => t.key === this.activeTab);
    return (idx < 0 ? 0 : idx) * 2 + 1;
  }
}
