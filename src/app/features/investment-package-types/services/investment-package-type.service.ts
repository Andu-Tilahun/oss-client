import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpService} from '../../../core/services/http.service';
import {Endpoints} from '../../../core/endpoint/endpoint.model';
import {
  InvestmentPackageTypeAgreement,
  InvestmentPackageTypeCreateRequest,
  InvestmentPackageTypeFilterRequest,
} from '../models/investment-package-type.model';
import {ApiResponse, PageResponse} from '../../../shared/models/api-response.model';
import {AssignExtensionWorkerRequest} from "../../assign-extension-worker-request";

@Injectable({
  providedIn: 'root',
})
export class InvestmentPackageTypeService {
  constructor(private httpService: HttpService) {
  }

  filter(request: InvestmentPackageTypeFilterRequest): Observable<PageResponse<InvestmentPackageTypeAgreement>> {
    return this.httpService.put<PageResponse<InvestmentPackageTypeAgreement>>(
      `${Endpoints.INVESTMENT_PACKAGES_ENDPOINT}/filter`,
      request,
    );
  }

  getById(id: string): Observable<ApiResponse<InvestmentPackageTypeAgreement>> {
    return this.httpService.get<ApiResponse<InvestmentPackageTypeAgreement>>(`${Endpoints.INVESTMENT_PACKAGE_TYPES_ENDPOINT}/${id}`);
  }

  create(request: InvestmentPackageTypeCreateRequest): Observable<ApiResponse<InvestmentPackageTypeAgreement>> {
    return this.httpService.post<ApiResponse<InvestmentPackageTypeAgreement>>(Endpoints.INVESTMENT_PACKAGE_TYPES_ENDPOINT, request);
  }

  update(id: string, request: InvestmentPackageTypeCreateRequest): Observable<ApiResponse<InvestmentPackageTypeAgreement>> {
    return this.httpService.put<ApiResponse<InvestmentPackageTypeAgreement>>(`${Endpoints.INVESTMENT_PACKAGE_TYPES_ENDPOINT}/${id}`, request);
  }

  adminDecide(packageTypeId: string, decision: 'ACCEPTED' | 'REJECTED'): Observable<ApiResponse<InvestmentPackageTypeAgreement>> {
    return this.httpService.post<ApiResponse<InvestmentPackageTypeAgreement>>(
      `${Endpoints.INVESTMENT_PACKAGE_TYPES_ENDPOINT}/${packageTypeId}/admin/decision`,
      { leaseStatus: decision },
    );
  }

  assignExtensionWorker(request: AssignExtensionWorkerRequest): Observable<ApiResponse<InvestmentPackageTypeAgreement>> {
    return this.httpService.post<ApiResponse<InvestmentPackageTypeAgreement>>(
      `${Endpoints.INVESTMENT_PACKAGE_TYPES_ENDPOINT}/assign-extension-worker`,
      request,
    );
  }

  send(packageTypeId: string): Observable<ApiResponse<InvestmentPackageTypeAgreement>> {
    return this.httpService.put<ApiResponse<InvestmentPackageTypeAgreement>>(
      `${Endpoints.INVESTMENT_PACKAGE_TYPES_ENDPOINT}/${packageTypeId}/send`,
      null,
    );
  }

  cancel(packageTypeId: string): Observable<ApiResponse<InvestmentPackageTypeAgreement>> {
    return this.httpService.put<ApiResponse<InvestmentPackageTypeAgreement>>(
      `${Endpoints.INVESTMENT_PACKAGE_TYPES_ENDPOINT}/${packageTypeId}/cancel`,
      null,
    );
  }

  getContractHtml(packageTypeId: string): Observable<string> {
    return this.httpService.get<string>(
      `${Endpoints.INVESTMENT_PACKAGE_TYPES_ENDPOINT}/${packageTypeId}/contract`,
    );
  }
}
