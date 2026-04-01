import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import {
  DISPLAYABLE_EVENT_LIFECYCLE_STATUSES,
  EventMutation,
  EventRecord
} from '../models/event.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly endpoint = 'Event';

  constructor(private readonly api: ApiService) {}

  getAll(): Observable<EventRecord[]> {
    return this.api.get<EventRecord[] | null>(this.endpoint).pipe(
      map((response) => Array.isArray(response) ? response.map((eventRecord) => this.normalizeEvent(eventRecord)) : [])
    );
  }

  create(payload: EventMutation): Observable<EventRecord> {
    const id = (payload.id || '').trim() || this.generateId();
    const requestPayload = this.toMutationPayload({ ...payload, id });

    return this.api
      .post<{ id?: string; entity?: EventRecord } | EventRecord>(this.endpoint, requestPayload)
      .pipe(
        map((response) => {
          const entityCandidate = (response as { entity?: EventRecord })?.entity;
          if (entityCandidate) {
            return this.normalizeEvent(entityCandidate);
          }

          const responseId = (response as { id?: string })?.id || id;
          return this.normalizeEvent({
            ...payload,
            id: responseId,
            PartitionKey: responseId,
            partitionKey: responseId
          });
        })
      );
  }

  update(payload: EventMutation): Observable<EventRecord> {
    const requestPayload = this.toMutationPayload(payload);

    return this.api
      .put<{ updated?: boolean; entity?: EventRecord } | EventRecord>(this.endpoint, requestPayload)
      .pipe(
        map((response) => {
          const entityCandidate = (response as { entity?: EventRecord })?.entity;
          if (entityCandidate) {
            return this.normalizeEvent(entityCandidate);
          }

          const id = (payload.id || '').trim();
          return this.normalizeEvent({
            ...payload,
            id,
            PartitionKey: id || undefined,
            partitionKey: id || undefined
          });
        })
      );
  }

  getActive(): Observable<EventRecord[]> {
    return this.api.get<EventRecord[] | null>(`${this.endpoint}/active`).pipe(
      map((response) => Array.isArray(response) ? response.map((eventRecord) => this.normalizeEvent(eventRecord)) : [])
    );
  }

  launch(eventId: string): Observable<{ id: string; launched: boolean; lifecycleStatus: string }> {
    const normalizedId = (eventId || '').trim();
    return this.api.post<{ id: string; launched: boolean; lifecycleStatus: string }>(
      `${this.endpoint}/${encodeURIComponent(normalizedId)}/launch`,
      {}
    );
  }

  close(eventId: string): Observable<{ id: string; closed: boolean; lifecycleStatus: string }> {
    const normalizedId = (eventId || '').trim();
    return this.api.post<{ id: string; closed: boolean; lifecycleStatus: string }>(
      `${this.endpoint}/${encodeURIComponent(normalizedId)}/close`,
      {}
    );
  }

  revertToDraft(eventId: string): Observable<{ id: string; reverted: boolean; lifecycleStatus: string }> {
    const normalizedId = (eventId || '').trim();
    return this.api.post<{ id: string; reverted: boolean; lifecycleStatus: string }>(
      `${this.endpoint}/${encodeURIComponent(normalizedId)}/revert-to-draft`,
      {}
    );
  }

  delete(eventId: string): Observable<boolean> {
    const normalizedId = (eventId || '').trim();
    return this.api
      .delete<{ deleted?: boolean; reason?: string } | string>(`${this.endpoint}/${encodeURIComponent(normalizedId)}`)
      .pipe(
        map((response) => {
          if (typeof response === 'string') {
            return true;
          }

          if (typeof response?.deleted === 'boolean') {
            return response.deleted;
          }

          return true;
        }),
        catchError((error: HttpErrorResponse) => {
          const reason = (error?.error?.reason as string) || '';
          return throwError(() => new Error(reason));
        })
      );
  }

  private toMutationPayload(payload: EventMutation): Record<string, unknown> {
    const id = (payload.id || '').trim();
    const requestPayload: Record<string, unknown> = {
      eventName: (payload.eventName || '').trim(),
      eventDescription: (payload.eventDescription || '').trim(),
      imageURL: (payload.imageURL || '').trim(),
      lifecycleStatus: this.normalizeLifecycleStatus(payload.lifecycleStatus),
      startDateUtc: this.normalizeDate(payload.startDateUtc),
      endDateUtc: this.normalizeDate(payload.endDateUtc),
      order: this.normalizeOrder(payload.order)
    };

    if (id) {
      requestPayload['id'] = id;
      requestPayload['partitionKey'] = id;
      requestPayload['PartitionKey'] = id;
    }

    return requestPayload;
  }

  private normalizeEvent(eventRecord: Partial<EventRecord> | EventMutation): EventRecord {
    const id = (eventRecord.id || '').trim();
    const partitionKey = (eventRecord.PartitionKey || eventRecord.partitionKey || id || '').trim();

    return {
      id,
      PartitionKey: partitionKey || undefined,
      partitionKey: partitionKey || undefined,
      eventName: (eventRecord.eventName || '').trim(),
      eventDescription: (eventRecord.eventDescription || '').trim(),
      imageURL: (eventRecord.imageURL || '').trim(),
      lifecycleStatus: this.normalizeLifecycleStatus(eventRecord.lifecycleStatus),
      startDateUtc: this.normalizeDate(eventRecord.startDateUtc),
      endDateUtc: this.normalizeDate(eventRecord.endDateUtc),
      order: this.normalizeOrder((eventRecord as Partial<EventRecord>).order)
    };
  }

  private normalizeOrder(value: number | undefined): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 0;
    }
    return Math.max(0, Math.trunc(value));
  }

  private normalizeLifecycleStatus(value: string | undefined): string {
    const normalized = (value || '').trim().toLowerCase();
    return DISPLAYABLE_EVENT_LIFECYCLE_STATUSES.includes(normalized as never) ? normalized : 'draft';
  }

  private normalizeDate(value: string | null | undefined): string | null {
    const normalized = (value || '').trim();
    if (!normalized) {
      return null;
    }

    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed.toISOString();
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
      const random = Math.floor(Math.random() * 16);
      const value = character === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }
}
