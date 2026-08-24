import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Area } from '../models/area.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AreaService {
  private readonly endpoint = 'Area';

  constructor(private readonly api: ApiService) {}

  getAll(): Observable<Area[]> {
    return this.api.get<Area[] | null>(this.endpoint).pipe(
      map((res) => (Array.isArray(res) ? res : []))
    );
  }

  create(name: string): Observable<{ id: string }> {
    return this.api.post<{ id: string }>(this.endpoint, { name, enabled: true });
  }

  update(area: Area): Observable<{ updated: boolean }> {
    return this.api.put<{ updated: boolean }>(`${this.endpoint}/${area.id}`, area);
  }
}
