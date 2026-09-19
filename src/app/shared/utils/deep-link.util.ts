import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';

/**
 * Emits the `?id=` query param whenever it is present and changes. Pages subscribe to this instead
 * of reading `route.snapshot`, so a global-search click still re-selects a record when the admin is
 * already on the destination page (Angular reuses the component, so the snapshot never updates).
 */
export function deepLinkParam$(route: ActivatedRoute, name = 'id'): Observable<string> {
  return route.queryParamMap.pipe(
    map(params => params.get(name)),
    filter((value): value is string => !!value),
    distinctUntilChanged(),
  );
}
