import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from './api.service';
import { BatchScheduleWindow } from '../models/batch-schedule.model';

@Injectable({ providedIn: 'root' })
export class BatchService {
  constructor(private readonly api: ApiService) {}

  getSchedule(areaId: string): Observable<BatchScheduleWindow[]> {
    return this.api.get<BatchScheduleWindow[] | null>(this.scheduleEndpoint(areaId)).pipe(
      map((res) => (Array.isArray(res) ? res : []))
    );
  }

  saveSchedule(areaId: string, windows: BatchScheduleWindow[]): Observable<BatchScheduleWindow[]> {
    return this.api.put<BatchScheduleWindow[]>(this.scheduleEndpoint(areaId), windows);
  }

  private scheduleEndpoint(areaId: string): string {
    return `batch/schedule/${encodeURIComponent(areaId)}`;
  }
}
