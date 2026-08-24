import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CreateStaffRequest, StaffAccount } from '../models/staff.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class StaffService {
  private readonly endpoint = 'Staff';

  constructor(private readonly api: ApiService) {}

  getAll(): Observable<StaffAccount[]> {
    return this.api.get<StaffAccount[] | null>(this.endpoint).pipe(
      map((res) => (Array.isArray(res) ? res : []))
    );
  }

  getMe(): Observable<StaffAccount> {
    return this.api.get<StaffAccount>(`${this.endpoint}/me`);
  }

  create(req: CreateStaffRequest): Observable<{ id: string }> {
    return this.api.post<{ id: string }>(this.endpoint, req);
  }

  update(id: string, patch: Partial<StaffAccount>): Observable<unknown> {
    return this.api.put(`${this.endpoint}/${id}`, patch);
  }
}
