import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { EventProductMutation, EventProductRecord } from '../models/event-product.model';
import { EventCategoryAggregateRecord, EventRecord } from '../models/event.model';
import { EventService } from './event.service';

@Injectable({
  providedIn: 'root'
})
export class EventProductService {
  constructor(private readonly eventService: EventService) {}

  getByEventCategory(eventCategoryId: string): Observable<EventProductRecord[]> {
    const normalizedEventCategoryId = (eventCategoryId || '').trim();
    return this.findEventAndCategory(normalizedEventCategoryId).pipe(
      map((result) => result ? this.getSortedProducts(result.category) : [])
    );
  }

  getByEvent(eventId: string): Observable<EventProductRecord[]> {
    const normalizedEventId = (eventId || '').trim();
    return this.eventService.getAll().pipe(
      map((events) => {
        const eventRecord = events.find((item) => item.id === normalizedEventId);
        if (!eventRecord || !Array.isArray(eventRecord.categories)) {
          return [];
        }

        return eventRecord.categories
          .flatMap((category) => this.getSortedProducts(category))
          .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));
      })
    );
  }

  create(payload: EventProductMutation): Observable<EventProductRecord> {
    const normalizedEventCategoryId = (payload.eventCategoryId || '').trim();
    if (!normalizedEventCategoryId) {
      return throwError(() => new Error('Event category id is required.'));
    }

    return this.findEventAndCategory(normalizedEventCategoryId).pipe(
      switchMap((result) => {
        if (!result) {
          return throwError(() => new Error('Event category not found.'));
        }

        const id = (payload.id || '').trim() || this.generateId();
        const product = this.normalizeRecord({
          ...payload,
          id,
          eventId: result.event.id,
          eventCategoryId: result.category.id,
          PartitionKey: id,
          partitionKey: id
        });

        const categories = result.event.categories!.map((category) =>
          category.id === result.category.id
            ? { ...category, products: [...this.getSortedProducts(category), product] }
            : category
        );

        return this.eventService.update({
          ...result.event,
          categories
        }).pipe(
          map((savedEvent) => {
            const savedCategory = savedEvent.categories?.find((item) => item.id === result.category.id);
            const savedProduct = savedCategory?.products?.find((item) => item.id === id);
            if (!savedProduct) {
              throw new Error('Saved product could not be resolved.');
            }
            return this.normalizeRecord(savedProduct);
          })
        );
      })
    );
  }

  update(payload: EventProductMutation): Observable<EventProductRecord> {
    const normalizedId = (payload.id || '').trim();
    if (!normalizedId) {
      return throwError(() => new Error('Event product id is required.'));
    }

    return this.eventService.getAll().pipe(
      switchMap((events) => {
        const result = this.findOwningEventAndCategoryForProduct(events, normalizedId);
        if (!result) {
          return throwError(() => new Error('Event product not found.'));
        }

        const categories = result.event.categories!.map((category) =>
          category.id === result.category.id
            ? {
                ...category,
                products: this.getSortedProducts(category).map((product) =>
                  product.id === normalizedId
                    ? this.normalizeRecord({
                        ...product,
                        ...payload,
                        id: normalizedId,
                        eventId: result.event.id,
                        eventCategoryId: result.category.id,
                        PartitionKey: normalizedId,
                        partitionKey: normalizedId
                      })
                    : product
                )
              }
            : category
        );

        return this.eventService.update({
          ...result.event,
          categories
        }).pipe(
          map((savedEvent) => {
            const savedCategory = savedEvent.categories?.find((item) => item.id === result.category.id);
            const savedProduct = savedCategory?.products?.find((item) => item.id === normalizedId);
            if (!savedProduct) {
              throw new Error('Saved product could not be resolved.');
            }
            return this.normalizeRecord(savedProduct);
          })
        );
      })
    );
  }

  delete(eventProductId: string): Observable<boolean> {
    const normalizedId = (eventProductId || '').trim();
    if (!normalizedId) {
      return of(false);
    }

    return this.eventService.getAll().pipe(
      switchMap((events) => {
        const result = this.findOwningEventAndCategoryForProduct(events, normalizedId);
        if (!result) {
          return of(false);
        }

        const categories = result.event.categories!.map((category) =>
          category.id === result.category.id
            ? {
                ...category,
                products: this.getSortedProducts(category)
                  .filter((product) => product.id !== normalizedId)
                  .map((product, index) => ({ ...product, order: index }))
              }
            : category
        );

        return this.eventService.update({
          ...result.event,
          categories
        }).pipe(map(() => true));
      })
    );
  }

  private findEventAndCategory(eventCategoryId: string): Observable<{ event: EventRecord; category: EventCategoryAggregateRecord } | undefined> {
    return this.eventService.getAll().pipe(
      map((events) => {
        for (const eventRecord of events) {
          const category = eventRecord.categories?.find((item) => item.id === eventCategoryId);
          if (category) {
            return { event: eventRecord, category };
          }
        }

        return undefined;
      })
    );
  }

  private findOwningEventAndCategoryForProduct(
    events: EventRecord[],
    eventProductId: string
  ): { event: EventRecord; category: EventCategoryAggregateRecord } | undefined {
    for (const eventRecord of events) {
      for (const category of eventRecord.categories || []) {
        if ((category.products || []).some((product) => product.id === eventProductId)) {
          return { event: eventRecord, category };
        }
      }
    }

    return undefined;
  }

  private getSortedProducts(category: EventCategoryAggregateRecord): EventProductRecord[] {
    return Array.isArray(category.products)
      ? [...category.products].sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
      : [];
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
      productName: (record.productName || '').trim(),
      productDescription: (record.productDescription || '').trim(),
      imageURL: (record.imageURL || record.overrideImageURL || '').trim(),
      imagePublicUrl: (record.imagePublicUrl || '').trim(),
      overrideImageURL: (record.overrideImageURL || record.imageURL || '').trim(),
      displayPercentage: this.normalizeMoney(record.displayPercentage),
      displayUnitName: (record.displayUnitName || '').trim(),
      orignalPrice: this.normalizeMoney(record.orignalPrice),
      currentPrice: this.normalizeMoney(record.currentPrice),
      currentCost: this.normalizeMoney(record.currentCost),
      unitName: (record.unitName || '').trim(),
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
