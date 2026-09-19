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

  /**
   * When true, the mobile/tablet accordion body drops its own horizontal padding — for content
   * that already manages its own edge-to-edge spacing (e.g. a full-width `app-data-table`),
   * rather than typical form/text content that relies on this component for breathing room.
   * Desktop spacing is unaffected either way.
   */
  @Input() noBodyPadding = false;

  /**
   * When true, drops the outer card chrome (background/border/shadow/rounded corners) and the
   * sticky header bar's own background/border — for tabs nested inside content that's already
   * boxed by an ancestor (e.g. a detail view rendered inside a table's expanded row), so this
   * component doesn't add a redundant nested card. Mobile accordion headers also become plain
   * section titles instead of a highlighted pill/button. Desktop layout is unaffected either way.
   */
  @Input() noCard = false;

  /**
   * Extra class(es) applied to the sticky header bar's own background when `noCard` is true
   * (ignored otherwise, since the card chrome already supplies `bg-white`). A sticky bar with no
   * background of its own lets scrolled-past content bleed through it visually, so pass this
   * whenever the tabs sit inside an independently-scrolling container — e.g. `'lg:bg-white'` when
   * the ancestor providing the "boxed" white background (per `noCard`'s own doc) only does so at
   * that breakpoint. Defaults to empty so existing `noCard` consumers keep their current look.
   */
  @Input() stickyBgClass = '';

  /**
   * When true, the mobile/tablet accordion's active-tab highlight uses the app's green brand
   * color instead of the default blue — for a tab group that should stand out/be easy to spot
   * at a glance (e.g. an investor's "My Farm / Explore / History" tabs). Opt-in per instance;
   * every other `app-tabs` consumer keeps the default blue. Desktop nav is unaffected either way.
   */
  @Input() greenAccent = false;

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
