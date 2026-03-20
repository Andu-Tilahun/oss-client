import {Injectable} from '@angular/core';
import {HttpService} from "../../../core/services/http.service";
import {Observable} from "rxjs";
import {PageResponse} from "../../../shared/models/api-response.model";
import {Role} from "../models/user.model";
import {HttpParams} from "@angular/common/http";
import {Endpoints} from "../../../core/endpoint/endpoint.model";

@Injectable({
  providedIn: 'root'
})
export class RoleService {

  constructor(private httpService: HttpService) {
  }

  getRoles(page: number = 0, size: number = 10, sortBy: string = 'id', sortDir: string = 'ASC'): Observable<PageResponse<Role>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    return this.httpService.get<PageResponse<Role>>(
      `${Endpoints.USERS_ENDPOINT}/roles`,
      undefined, // headers
      params     // params
    );

  }
}
