import { convertToParamMap, ParamMap } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

/** Test helper: an ActivatedRoute stand-in whose query params can change over time, like the real router. */
export function mockRouteWithQueryParams(initial: Record<string, string> = {}) {
  const params$ = new BehaviorSubject<ParamMap>(convertToParamMap(initial));
  return {
    route: {
      get snapshot() { return { queryParamMap: params$.value }; },
      queryParamMap: params$.asObservable(),
    },
    setQueryParams: (params: Record<string, string>) => params$.next(convertToParamMap(params)),
  };
}
