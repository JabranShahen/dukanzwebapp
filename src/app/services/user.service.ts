import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { DukanzUser } from '../models/user.model';
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

  update(user: DukanzUser): Observable<unknown> {
    return this.api.put(`${this.endpoint}/${user.id}`, user);
  }
}
