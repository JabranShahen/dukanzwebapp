import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import {
  ClaimDetail,
  ClaimListFilters,
  ClaimListResponse,
  ClaimStatusUpdateRequest,
  ClaimStatusUpdateResponse
} from '../models/claim.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class ClaimService {
  private readonly endpoint = 'Claims';

  constructor(private readonly api: ApiService) {}

  getClaims(filters: ClaimListFilters = {}): Observable<ClaimListResponse> {
    const query = this.toQuery(filters);
    const path = query ? `${this.endpoint}?${query}` : this.endpoint;

    return this.api.get<ClaimListResponse | null>(path).pipe(
      map((response) => ({
        totalCount: response?.totalCount ?? 0,
        claims: Array.isArray(response?.claims) ? response!.claims : []
      })),
      catchError(() => of({ totalCount: 0, claims: [] }))
    );
  }

  getClaim(claimId: string, includeAttachmentUrls = false): Observable<ClaimDetail> {
    const query = includeAttachmentUrls ? '?includeAttachmentUrls=true' : '';
    return this.api.get<ClaimDetail>(`${this.endpoint}/${encodeURIComponent(claimId)}${query}`);
  }

  updateStatus(claimId: string, request: ClaimStatusUpdateRequest): Observable<ClaimStatusUpdateResponse> {
    return this.api.patch<ClaimStatusUpdateResponse>(
      `${this.endpoint}/${encodeURIComponent(claimId)}/status`,
      request
    );
  }

  private toQuery(filters: ClaimListFilters): string {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && `${value}`.trim() !== '') {
        params.set(key, `${value}`.trim());
      }
    });

    return params.toString();
  }
}
