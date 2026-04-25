import { Directive, TemplateRef } from '@angular/core';

@Directive({
  selector: 'ng-template[cardBodyTemplate]',
})
export class CardBodyTemplateDirective<T = unknown> {
  constructor(public readonly templateRef: TemplateRef<{ $implicit: T }>) {}
}

@Directive({
  selector: 'ng-template[cardFooterTemplate]',
})
export class CardFooterTemplateDirective<T = unknown> {
  constructor(public readonly templateRef: TemplateRef<{ $implicit: T }>) {}
}
