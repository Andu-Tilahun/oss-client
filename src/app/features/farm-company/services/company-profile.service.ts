import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {ApiResponse} from '../../../shared/models/api-response.model';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {CompanyProfile, CompanyProfileRequest} from '../models/company-profile.model';

@Injectable({
  providedIn: 'root',
})
export class CompanyProfileService {
  constructor(private httpService: HttpService) {}

  getCompanyProfile(): Observable<CompanyProfile> {
    return this.httpService.get<CompanyProfile>(Endpoints.FARM_COMPANY_ENDPOINT);
  }

  updateCompanyProfile(request: CompanyProfileRequest): Observable<ApiResponse<CompanyProfile>> {
    return this.httpService.put<ApiResponse<CompanyProfile>>(Endpoints.FARM_COMPANY_ENDPOINT, request);
  }
}
