import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { EventCategoryMutation, EventCategoryRecord } from '../models/event-category.model';
import { EventCategoryAggregateRecord, EventRecord } from '../models/event.model';
import { EventService } from './event.service';

@Injectable({
  providedIn: 'root'
})
export class EventCategoryService {
  constructor(private readonly eventService: EventService) {}

  getByEvent(eventId: string): Observable<EventCategoryRecord[]> {
    const normalizedEventId = (eventId || '').trim();
    return this.getEventById(normalizedEventId).pipe(
      map((eventRecord) => eventRecord ? this.getSortedCategories(eventRecord) : [])
    );
  }

  create(payload: EventCategoryMutation): Observable<EventCategoryRecord> {
    const normalizedEventId = (payload.eventId || '').trim();
    if (!normalizedEventId) {
      return throwError(() => new Error('Event id is required.'));
    }

    return this.getEventById(normalizedEventId).pipe(
      switchMap((eventRecord) => {
        if (!eventRecord) {
          return throwError(() => new Error('Event not found.'));
        }

        const id = (payload.id || '').trim() || this.generateId();
        const categories = this.getSortedCategories(eventRecord);
        const category: EventCategoryRecord = this.normalizeRecord({
          ...payload,
          id,
          eventId: normalizedEventId,
          PartitionKey: id,
          partitionKey: id
        });

        return this.eventService.update({
          ...eventRecord,
          categories: [...categories, { ...category, products: [] }]
        }).pipe(
          map((savedEvent) => {
            const savedCategory = this.getSortedCategories(savedEvent).find((item) => item.id === id);
            if (!savedCategory) {
              throw new Error('Saved category could not be resolved.');
            }
            return savedCategory;
          })
        );
      })
    );
  }

  update(payload: EventCategoryMutation): Observable<EventCategoryRecord> {
    const normalizedId = (payload.id || '').trim();
    if (!normalizedId) {
      return throwError(() => new Error('Event category id is required.'));
    }

    return this.getAllEvents().pipe(
      switchMap((events) => {
        const owningEvent = events.find((eventRecord) =>
          this.getSortedCategories(eventRecord).some((item) => item.id === normalizedId));
        if (!owningEvent) {
          return throwError(() => new Error('Event category not found.'));
        }

        const categories = this.getSortedCategories(owningEvent).map((category) =>
          category.id === normalizedId
            ? {
                ...category,
                ...this.normalizeRecord({
                  ...payload,
                  id: normalizedId,
                  eventId: owningEvent.id,
                  PartitionKey: normalizedId,
                  partitionKey: normalizedId
                }),
                products: category.products || []
              }
            : category
        );

        return this.eventService.update({
          ...owningEvent,
          categories
        }).pipe(
          map((savedEvent) => {
            const savedCategory = this.getSortedCategories(savedEvent).find((item) => item.id === normalizedId);
            if (!savedCategory) {
              throw new Error('Saved category could not be resolved.');
            }
            return savedCategory;
          })
        );
      })
    );
  }

  delete(eventCategoryId: string): Observable<boolean> {
    const normalizedId = (eventCategoryId || '').trim();
    if (!normalizedId) {
      return of(false);
    }

    return this.getAllEvents().pipe(
      switchMap((events) => {
        const owningEvent = events.find((eventRecord) =>
          this.getSortedCategories(eventRecord).some((item) => item.id === normalizedId));
        if (!owningEvent) {
          return of(false);
        }

        const categories = this.getSortedCategories(owningEvent)
          .filter((category) => category.id !== normalizedId)
          .map((category, index) => ({
            ...category,
            order: index
          }));

        return this.eventService.update({
          ...owningEvent,
          categories
        }).pipe(map(() => true));
      })
    );
  }

  private getAllEvents(): Observable<EventRecord[]> {
    return this.eventService.getAll();
  }

  private getEventById(eventId: string): Observable<EventRecord | undefined> {
    return this.getAllEvents().pipe(
      map((events) => events.find((eventRecord) => eventRecord.id === eventId))
    );
  }

  private getSortedCategories(eventRecord: EventRecord): EventCategoryAggregateRecord[] {
    return Array.isArray(eventRecord.categories)
      ? [...eventRecord.categories].sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
      : [];
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
      categoryName: (record.categoryName || '').trim(),
      imageURL: (record.imageURL || record.overrideImageURL || '').trim(),
      overrideImageURL: (record.overrideImageURL || record.imageURL || '').trim(),
      visible: !!record.visible,
      order: this.normalizeOrder(record.order)
    };
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
