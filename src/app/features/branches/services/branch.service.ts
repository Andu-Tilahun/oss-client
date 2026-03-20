import {Injectable} from '@angular/core';
import {HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {ApiResponse, PageResponse} from '../../../shared/models/api-response.model';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {Branch, BranchRequest} from '../models/branch.model';

@Injectable({
  providedIn: 'root'
})
export class BranchService {

  constructor(private httpService: HttpService) {
  }

  getAllBranches(page: number = 0, size: number = 10): Observable<PageResponse<Branch>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.httpService.get<PageResponse<Branch>>(
      Endpoints.BRANCHES_ENDPOINT,
      undefined,
      params
    );
  }

  getBranchById(id: string): Observable<ApiResponse<Branch>> {
    return this.httpService.get<ApiResponse<Branch>>(
      `${Endpoints.BRANCHES_ENDPOINT}/${id}`,
    );
  }

  createBranch(request: BranchRequest): Observable<ApiResponse<Branch>> {
    return this.httpService.post<ApiResponse<Branch>>(
      Endpoints.BRANCHES_ENDPOINT,
      request
    );
  }

  updateBranch(id: string, request: BranchRequest): Observable<ApiResponse<Branch>> {
    return this.httpService.put<ApiResponse<Branch>>(
      `${Endpoints.BRANCHES_ENDPOINT}/${id}`,
      request,
    );
  }

  deleteBranch(id: string): Observable<ApiResponse<void>> {
    return this.httpService.delete<ApiResponse<void>>(
      `${Endpoints.BRANCHES_ENDPOINT}/${id}`,
    );
  }
}

