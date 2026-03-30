import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ProductCategory, ProductCategoryMutation } from '../models/product-category.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class ProductCategoryService {
  private readonly endpoint = 'ProductCategory';

  constructor(private readonly api: ApiService) {}

  getAll(): Observable<ProductCategory[]> {
    return this.api.get<ProductCategory[] | null>(this.endpoint).pipe(
      map((response) => Array.isArray(response) ? response : [])
    );
  }

  create(payload: ProductCategoryMutation): Observable<ProductCategory> {
    const id = (payload.id || '').trim() || this.generateId();
    const requestPayload = this.toMutationPayload({ ...payload, id });

    return this.api
      .post<{ id?: string; entity?: ProductCategory } | ProductCategory>(this.endpoint, requestPayload)
      .pipe(
        map((response) => {
          const entityCandidate = (response as { entity?: ProductCategory })?.entity;
          if (entityCandidate) {
            return entityCandidate;
          }

          const responseId = (response as { id?: string })?.id;
          return {
            id: responseId || id,
            partitionKey: responseId || id,
            PartitionKey: responseId || id,
            productCategoryName: (payload.productCategoryName || '').trim(),
            productCategoryImageURL: (payload.productCategoryImageURL || '').trim(),
            visible: !!payload.visible,
            order: Number(payload.order || 0)
          };
        })
      );
  }

  update(payload: ProductCategoryMutation): Observable<ProductCategory> {
    const requestPayload = this.toMutationPayload(payload);

    return this.api
      .put<{ updated?: boolean; entity?: ProductCategory } | ProductCategory>(this.endpoint, requestPayload)
      .pipe(
        map((response) => {
          const entityCandidate = (response as { entity?: ProductCategory })?.entity;
          if (entityCandidate) {
            return entityCandidate;
          }

          const id = (payload.id || '').trim();
          return {
            id,
            partitionKey: id || undefined,
            PartitionKey: id || undefined,
            productCategoryName: (payload.productCategoryName || '').trim(),
            productCategoryImageURL: (payload.productCategoryImageURL || '').trim(),
            visible: !!payload.visible,
            order: Number(payload.order || 0)
          };
        })
      );
  }

  delete(categoryId: string): Observable<boolean> {
    const normalizedId = (categoryId || '').trim();
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

  private toMutationPayload(payload: ProductCategoryMutation): Record<string, unknown> {
    const id = (payload.id || '').trim();

    const requestPayload: Record<string, unknown> = {
      productCategoryName: (payload.productCategoryName || '').trim(),
      productCategoryImageURL: (payload.productCategoryImageURL || '').trim(),
      visible: !!payload.visible,
      order: Number(payload.order || 0)
    };

    if (id) {
      requestPayload['id'] = id;
      requestPayload['partitionKey'] = id;
      requestPayload['PartitionKey'] = id;
    }

    return requestPayload;
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
