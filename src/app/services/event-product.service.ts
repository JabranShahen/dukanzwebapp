import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { EventProductMutation, EventProductRecord } from '../models/event-product.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class EventProductService {
  private readonly endpoint = 'EventProduct';

  constructor(private readonly api: ApiService) {}

  getByEventCategory(eventCategoryId: string): Observable<EventProductRecord[]> {
    const normalizedEventCategoryId = (eventCategoryId || '').trim();
    return this.api.get<EventProductRecord[] | null>(`${this.endpoint}/eventCategory/${encodeURIComponent(normalizedEventCategoryId)}`).pipe(
      map((response) => Array.isArray(response) ? response.map((record) => this.normalizeRecord(record)) : [])
    );
  }

  getByEvent(eventId: string): Observable<EventProductRecord[]> {
    const normalizedEventId = (eventId || '').trim();
    return this.api.get<EventProductRecord[] | null>(`${this.endpoint}/event/${encodeURIComponent(normalizedEventId)}`).pipe(
      map((response) => Array.isArray(response) ? response.map((record) => this.normalizeRecord(record)) : [])
    );
  }

  create(payload: EventProductMutation): Observable<EventProductRecord> {
    const id = (payload.id || '').trim() || this.generateId();
    const requestPayload = this.toMutationPayload({ ...payload, id });

    return this.api
      .post<{ id?: string; entity?: EventProductRecord } | EventProductRecord>(this.endpoint, requestPayload)
      .pipe(
        map((response) => {
          const entityCandidate = (response as { entity?: EventProductRecord })?.entity;
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

  update(payload: EventProductMutation): Observable<EventProductRecord> {
    const requestPayload = this.toMutationPayload(payload);

    return this.api
      .put<{ updated?: boolean; entity?: EventProductRecord } | EventProductRecord>(this.endpoint, requestPayload)
      .pipe(
        map((response) => {
          const entityCandidate = (response as { entity?: EventProductRecord })?.entity;
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

  delete(eventProductId: string): Observable<boolean> {
    const normalizedId = (eventProductId || '').trim();
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

  private toMutationPayload(payload: EventProductMutation): Record<string, unknown> {
    const id = (payload.id || '').trim();
    const eventId = (payload.eventId || '').trim();
    const eventCategoryId = (payload.eventCategoryId || '').trim();
    const productId = (payload.productId || '').trim();
    const requestPayload: Record<string, unknown> = {
      eventId,
      eventCategoryId,
      productId,
      productName: this.normalizeText(payload.productName),
      productDescription: this.normalizeText(payload.productDescription),
      imageURL: this.normalizeText(payload.imageURL),
      displayPercentage: this.normalizeMoney(payload.displayPercentage),
      displayUnitName: this.normalizeText(payload.displayUnitName),
      orignalPrice: this.normalizeMoney(payload.orignalPrice),
      currentPrice: this.normalizeMoney(payload.currentPrice),
      currentCost: this.normalizeMoney(payload.currentCost),
      unitName: this.normalizeText(payload.unitName),
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

  private normalizeRecord(record: Partial<EventProductRecord> | EventProductMutation): EventProductRecord {
    const id = (record.id || '').trim();
    const partitionKey = (record.PartitionKey || record.partitionKey || id || '').trim();

    return {
      id,
      PartitionKey: partitionKey || undefined,
      partitionKey: partitionKey || undefined,
      eventId: (record.eventId || '').trim(),
      eventCategoryId: (record.eventCategoryId || '').trim(),
      productId: (record.productId || '').trim(),
      productName: this.normalizeText(record.productName),
      productDescription: this.normalizeText(record.productDescription),
      imageURL: this.normalizeText(record.imageURL),
      displayPercentage: this.normalizeMoney(record.displayPercentage),
      displayUnitName: this.normalizeText(record.displayUnitName),
      orignalPrice: this.normalizeMoney(record.orignalPrice),
      currentPrice: this.normalizeMoney(record.currentPrice),
      currentCost: this.normalizeMoney(record.currentCost),
      unitName: this.normalizeText(record.unitName),
      visible: !!record.visible,
      order: this.normalizeOrder(record.order)
    };
  }

  private normalizeMoney(value: number | undefined): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, value);
  }

  private normalizeText(value: string | undefined): string {
    return (value || '').trim();
  }

  private normalizeOrder(value: number | undefined): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, Math.trunc(value));
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
