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

  /** Emits the key of the tab that was clicked */
  @Output() activeTabChange = new EventEmitter<string>();

  setTab(key: string): void {
    if (key !== this.activeTab) {
      this.activeTab = key;
      this.activeTabChange.emit(key);
    }
  }

  /** Normalise iconPath to always be an array for *ngFor */
  paths(tab: TabItem): string[] {
    if (!tab.iconPath) return [];
    return Array.isArray(tab.iconPath) ? tab.iconPath : [tab.iconPath];
  }
}
