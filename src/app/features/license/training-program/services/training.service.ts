import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {
  TrainingProgram,
  TrainingProgramCreateRequest,
  RegionalQuotaRequest,
  OrganizationalQuotaRequest,
  TrainingProgramFilterRequest
} from '../models/training.model';
import {HttpService, RequestType} from "../../../../core/services/http.service";
import {Endpoints} from "../../../../core/endpoint/endpoint.model";
import {PageResponse} from "../../../../shared/models/api-response.model";
import {ClearingAgentApplicant} from "../../clearing-agent-applicant/models/clearing-agent-applicant.model";


@Injectable({
  providedIn: 'root'
})
export class TrainingService {
  constructor(private httpService: HttpService) {
  }

  createProgram(request: TrainingProgramCreateRequest): Observable<TrainingProgram> {
    return this.httpService.post<TrainingProgram>(
      Endpoints.TRAINING_PROGRAMS_ENDPOINT,
      request, undefined, { requestType: RequestType.LOCAL }
    );
  }

  assignRegionalQuota(programId: string, request: RegionalQuotaRequest): Observable<TrainingProgram> {
    return this.httpService.put<TrainingProgram>(
      `${Endpoints.TRAINING_PROGRAMS_ENDPOINT}/${programId}/regional-quota`,
      request, undefined, { requestType: RequestType.LOCAL }
    );
  }

  assignOrganizationalQuota(programId: string, request: OrganizationalQuotaRequest): Observable<TrainingProgram> {
    return this.httpService.put<TrainingProgram>(
      `${Endpoints.TRAINING_PROGRAMS_ENDPOINT}/${programId}/organizational-quota`,
      request, undefined, { requestType: RequestType.LOCAL }
    );
  }

  publishProgram(programId: string): Observable<TrainingProgram> {
    return this.httpService.put<TrainingProgram>(
      `${Endpoints.TRAINING_PROGRAMS_ENDPOINT}/${programId}/publish`,
      {}, undefined, { requestType: RequestType.LOCAL }
    );
  }

  getProgram(id: any): Observable<TrainingProgram> {
    return this.httpService.get<TrainingProgram>(
      `${Endpoints.TRAINING_PROGRAMS_ENDPOINT}/${id}`,
    );
  }

  getAllPrograms(): Observable<TrainingProgram[]> {
    return this.httpService.get<TrainingProgram[]>(
      `${Endpoints.TRAINING_PROGRAMS_ENDPOINT}`,
    );
  }

  getByUserRequestId(userRequestId: string): Observable<TrainingProgram> {
    return this.httpService.get<TrainingProgram>(
      `${Endpoints.TRAINING_PROGRAMS_ENDPOINT}/by-user-request/${userRequestId}`,
      undefined, undefined, { requestType: RequestType.LOCAL }
    );
  }

  filterPrograms(request: TrainingProgramFilterRequest): Observable<PageResponse<TrainingProgram>> {
    return this.httpService.post<PageResponse<TrainingProgram>>(
      `${Endpoints.TRAINING_PROGRAMS_ENDPOINT}/filter`,
      request
    );
  }

  updateProgram(programId: string, request: TrainingProgramCreateRequest): Observable<TrainingProgram> {
    return this.httpService.put<TrainingProgram>(
      `${Endpoints.TRAINING_PROGRAMS_ENDPOINT}/${programId}`,
      request, undefined, { requestType: RequestType.LOCAL }
    );
  }
}
