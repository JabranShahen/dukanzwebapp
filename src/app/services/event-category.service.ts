import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { EventCategoryMutation, EventCategoryRecord } from '../models/event-category.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class EventCategoryService {
  private readonly endpoint = 'EventCategory';

  constructor(private readonly api: ApiService) {}

  getByEvent(eventId: string): Observable<EventCategoryRecord[]> {
    const normalizedEventId = (eventId || '').trim();
    return this.api.get<EventCategoryRecord[] | null>(`${this.endpoint}/event/${encodeURIComponent(normalizedEventId)}`).pipe(
      map((response) => Array.isArray(response) ? response.map((record) => this.normalizeRecord(record)) : [])
    );
  }

  create(payload: EventCategoryMutation): Observable<EventCategoryRecord> {
    const id = (payload.id || '').trim() || this.generateId();
    const requestPayload = this.toMutationPayload({ ...payload, id });

    return this.api
      .post<{ id?: string; entity?: EventCategoryRecord } | EventCategoryRecord>(this.endpoint, requestPayload)
      .pipe(
        map((response) => {
          const entityCandidate = (response as { entity?: EventCategoryRecord })?.entity;
          if (entityCandidate) {
            return this.normalizeRecord(entityCandidate);
          }

          const responseId = (response as { id?: string })?.id || id;
          return this.normalizeRecord({
            ...payload,
            id: responseId,
            PartitionKey: responseId,
            partitionKey: responseId
          });
        })
      );
  }

  update(payload: EventCategoryMutation): Observable<EventCategoryRecord> {
    const requestPayload = this.toMutationPayload(payload);

    return this.api
      .put<{ updated?: boolean; entity?: EventCategoryRecord } | EventCategoryRecord>(this.endpoint, requestPayload)
      .pipe(
        map((response) => {
          const entityCandidate = (response as { entity?: EventCategoryRecord })?.entity;
          if (entityCandidate) {
            return this.normalizeRecord(entityCandidate);
          }

          const id = (payload.id || '').trim();
          return this.normalizeRecord({
            ...payload,
            id,
            PartitionKey: id || undefined,
            partitionKey: id || undefined
          });
        })
      );
  }

  delete(eventCategoryId: string): Observable<boolean> {
    const normalizedId = (eventCategoryId || '').trim();
    return this.api
      .delete<{ deleted?: boolean } | string>(`${this.endpoint}/${encodeURIComponent(normalizedId)}`)
      .pipe(
        map((response) => {
          if (typeof response === 'string') {
            return true;
          }

          if (typeof response?.deleted === 'boolean') {
            return response.deleted;
          }

          return true;
        })
      );
  }

  private toMutationPayload(payload: EventCategoryMutation): Record<string, unknown> {
    const id = (payload.id || '').trim();
    const eventId = (payload.eventId || '').trim();
    const productCategoryId = (payload.productCategoryId || '').trim();
    const requestPayload: Record<string, unknown> = {
      eventId,
      productCategoryId,
      overrideImageURL: (payload.overrideImageURL || '').trim(),
      visible: !!payload.visible,
      order: this.normalizeOrder(payload.order)
    };

    if (id) {
      requestPayload['id'] = id;
      requestPayload['partitionKey'] = id;
      requestPayload['PartitionKey'] = id;
    }

    return requestPayload;
  }

  private normalizeRecord(record: Partial<EventCategoryRecord> | EventCategoryMutation): EventCategoryRecord {
    const id = (record.id || '').trim();
    const partitionKey = (record.PartitionKey || record.partitionKey || id || '').trim();

    return {
      id,
      PartitionKey: partitionKey || undefined,
      partitionKey: partitionKey || undefined,
      eventId: (record.eventId || '').trim(),
      productCategoryId: (record.productCategoryId || '').trim(),
      overrideImageURL: (record.overrideImageURL || '').trim(),
      visible: !!record.visible,
      order: this.normalizeOrder(record.order)
    };
  }

  private normalizeOrder(value: number | undefined): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 0;
    }

    return Math.trunc(value);
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
