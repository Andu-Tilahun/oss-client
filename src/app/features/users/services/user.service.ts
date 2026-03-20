import {Injectable} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {UpdateUserRequest, User} from '../models/user.model';
import {HttpService} from "../../../core/services/http.service";
import {ApiResponse, PageResponse} from "../../../shared/models/api-response.model";
import {Endpoints} from "../../../core/endpoint/endpoint.model";
import {FilterRequest} from "../pages/user-filter/filter-request";
import {Branch} from "../../branches/models/branch.model";

@Injectable({
  providedIn: 'root'
})
export class UserService {


  constructor(private httpService: HttpService) {
  }


  getAllUsers(page: number = 0, size: number = 10, sortBy: string = 'id', sortDir: string = 'ASC'): Observable<PageResponse<User>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    return this.httpService.get<PageResponse<User>>(
      Endpoints.USERS_ENDPOINT,
      undefined, // headers
      params     // params
    );

  }

  filterUsers(request: FilterRequest): Observable<PageResponse<User>> {

    return this.httpService.post<PageResponse<User>>(
      `${Endpoints.USERS_ENDPOINT}/filter`,
      request
    );
  }

  getBranches(): Observable<Branch[]> {
    return this.httpService.get<PageResponse<Branch>>(
      Endpoints.BRANCHES_ENDPOINT
    ).pipe(
      map(page => page?.content ?? [])
    );
  }

  /** Get users that have a specific role (e.g. OPERATOR). Used for assigning user requests. */
  getUsersByRole(role: string, page: number = 0, size: number = 200): Observable<User[]> {
    const request: FilterRequest = {
      roles: [role],
      page,
      size,
    };
    return this.httpService.post<PageResponse<User>>(
      `${Endpoints.USERS_ENDPOINT}/filter`,
      request
    ).pipe(
      map((res) => res?.content ?? [])
    );
  }

  getUserById(id: string): Observable<User> {
    return this.httpService.get<User>(
      `${Endpoints.USERS_ENDPOINT}/${id}`,
    );
  }

  updateUser(id: string, request: UpdateUserRequest): Observable<ApiResponse<User>> {
    return this.httpService.put<ApiResponse<User>>(
      `${Endpoints.USERS_ENDPOINT}/${id}`,
      request,
    );
  }

  profileUser(request: UpdateUserRequest): Observable<User> {
    return this.httpService.put<User>(
      `${Endpoints.USERS_ENDPOINT}/profile`,
      request,
    );
  }

  deleteUser(id: string): Observable<ApiResponse<void>> {
    return this.httpService.delete<ApiResponse<void>>(
      `${Endpoints.USERS_ENDPOINT}/${id}`,
    );
  }

  lockUser(id: string): Observable<User> {
    return this.httpService.put<User>(`${Endpoints.USERS_ENDPOINT}/${id}/lock`, {});
  }

  unlockUser(id: string): Observable<ApiResponse<User>> {
    return this.httpService.put<ApiResponse<User>>(`${Endpoints.USERS_ENDPOINT}/${id}/unlock`, {});
  }
}
