import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Product, ProductMutation, createEmptyProductCategory } from '../models/product.model';
import { ProductCategory } from '../models/product-category.model';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly endpoint = 'DukanzProduct';

  constructor(private readonly api: ApiService) {}

  getAll(): Observable<Product[]> {
    return this.api.get<Product[] | null>(this.endpoint).pipe(
      map((response) => Array.isArray(response) ? response.map((product) => this.normalizeProduct(product)) : [])
    );
  }

  create(payload: ProductMutation): Observable<Product> {
    const id = (payload.id || '').trim() || this.generateId();
    const requestPayload = this.toMutationPayload({ ...payload, id });

    return this.api
      .post<{ id?: string; entity?: Product } | Product>(this.endpoint, requestPayload)
      .pipe(
        map((response) => {
          const entityCandidate = (response as { entity?: Product })?.entity;
          if (entityCandidate) {
            return this.normalizeProduct(entityCandidate);
          }

          const responseId = (response as { id?: string })?.id || id;
          return this.normalizeProduct({
            ...payload,
            id: responseId,
            PartitionKey: responseId,
            partitionKey: responseId,
            productCategory: this.normalizeProductCategory(payload.productCategory)
          });
        })
      );
  }

  update(payload: ProductMutation): Observable<Product> {
    const requestPayload = this.toMutationPayload(payload);

    return this.api
      .put<{ updated?: boolean; entity?: Product } | Product>(this.endpoint, requestPayload)
      .pipe(
        map((response) => {
          const entityCandidate = (response as { entity?: Product })?.entity;
          if (entityCandidate) {
            return this.normalizeProduct(entityCandidate);
          }

          const id = (payload.id || '').trim();
          return this.normalizeProduct({
            ...payload,
            id,
            PartitionKey: id || undefined,
            partitionKey: id || undefined,
            productCategory: this.normalizeProductCategory(payload.productCategory)
          });
        })
      );
  }

  delete(productId: string): Observable<boolean> {
    const normalizedId = (productId || '').trim();
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

  private toMutationPayload(payload: ProductMutation): Record<string, unknown> {
    const id = (payload.id || '').trim();

    const requestPayload: Record<string, unknown> = {
      productName: (payload.productName || '').trim(),
      productDescription: (payload.productDescription || '').trim(),
      orignalPrice: this.normalizeNumber(payload.orignalPrice),
      currentPrice: this.normalizeNumber(payload.currentPrice),
      currentCost: this.normalizeNumber(payload.currentCost),
      unitName: (payload.unitName || '').trim(),
      displayPercentage: this.normalizeNumber(payload.displayPercentage),
      displayUnitName: (payload.displayUnitName || '').trim(),
      imageURL: (payload.imageURL || '').trim(),
      visible: !!payload.visible,
      productCategory: this.normalizeProductCategory(payload.productCategory)
    };

    if (typeof payload.order === 'number') {
      requestPayload['order'] = payload.order;
    }

    if (id) {
      requestPayload['id'] = id;
      requestPayload['partitionKey'] = id;
      requestPayload['PartitionKey'] = id;
    }

    return requestPayload;
  }

  private normalizeProduct(product: Partial<Product> | ProductMutation): Product {
    const id = (product.id || '').trim();
    const partitionKey = (product.PartitionKey || product.partitionKey || id || '').trim();

    return {
      id,
      PartitionKey: partitionKey || undefined,
      partitionKey: partitionKey || undefined,
      productName: (product.productName || '').trim(),
      productDescription: (product.productDescription || '').trim(),
      orignalPrice: this.normalizeNumber(product.orignalPrice),
      currentPrice: this.normalizeNumber(product.currentPrice),
      currentCost: this.normalizeNumber(product.currentCost),
      unitName: (product.unitName || '').trim(),
      displayPercentage: this.normalizeNumber(product.displayPercentage),
      displayUnitName: (product.displayUnitName || '').trim(),
      imageURL: (product.imageURL || '').trim(),
      visible: !!product.visible,
      productCategory: this.normalizeProductCategory(product.productCategory),
      ...(typeof product.order === 'number' ? { order: product.order } : {})
    };
  }

  private normalizeProductCategory(category: ProductCategory | null | undefined): ProductCategory {
    const fallback = createEmptyProductCategory();
    const id = (category?.id || '').trim();

    return {
      id,
      PartitionKey: id,
      partitionKey: id,
      productCategoryName: (category?.productCategoryName || '').trim(),
      productCategoryImageURL: (category?.productCategoryImageURL || '').trim(),
      visible: typeof category?.visible === 'boolean' ? category.visible : fallback.visible,
      order: typeof category?.order === 'number' ? category.order : fallback.order
    };
  }

  private normalizeNumber(value: number | undefined): number {
    return Number.isFinite(value) ? Number(value) : 0;
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
      const random = Math.floor(Math.random() * 16);
      const generatedValue = character === 'x' ? random : (random & 0x3) | 0x8;
      return generatedValue.toString(16);
    });
  }
}
