import { Directive } from '@angular/core';

/** Place on the element projected into the card footer (e.g. the Assign button container). */
@Directive({
  selector: '[cardFooter]',
  standalone: true
})
export class CardFooterDirective {}
