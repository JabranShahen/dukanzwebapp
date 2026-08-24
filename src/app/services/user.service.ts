import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { DukanzUser, UnallocatedCustomer } from '../models/user.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly endpoint = 'User';

  constructor(private readonly api: ApiService) {}

  getAll(): Observable<DukanzUser[]> {
    return this.api.get<DukanzUser[] | null>(this.endpoint).pipe(
      map((res) => (Array.isArray(res) ? res : []))
    );
  }

  getMe(): Observable<DukanzUser> {
    return this.api.get<DukanzUser>(`${this.endpoint}/me`);
  }

  create(user: DukanzUser): Observable<string> {
    return this.api.post<string>(this.endpoint, user);
  }

  update(user: DukanzUser): Observable<unknown> {
    return this.api.put(`${this.endpoint}/${user.id}`, user);
  }

  getUnallocated(): Observable<UnallocatedCustomer[]> {
    return this.api.get<UnallocatedCustomer[] | null>(`${this.endpoint}/unallocated`).pipe(
      map((res) => (Array.isArray(res) ? res : []))
    );
  }

  allocate(userId: string, areaId: string): Observable<{ allocated: boolean; ordersUpdated: number }> {
    return this.api.post<{ allocated: boolean; ordersUpdated: number }>(
      `${this.endpoint}/${userId}/allocate`,
      { areaId }
    );
  }
}
