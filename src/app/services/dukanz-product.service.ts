import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ApiService } from './api-service';
import { createIdleState, ResourceState } from './resource-state';
import { environment } from '../../environments/environment';
import { CreateProductRequest, Product, ProductCategoryReference, UpdateProductRequest } from '../entities/product';

@Injectable({
  providedIn: 'root',
})
export class DukanzProductService {
  private readonly stateSubject = new BehaviorSubject<ResourceState<Product[]>>(createIdleState([]));
  readonly state$ = this.stateSubject.asObservable();

  constructor(private readonly api: ApiService) {}

  load(force = false): void {
    const current = this.stateSubject.value;
    if (!force && current.status === 'loading') {
      return;
    }

    this.stateSubject.next({
      status: 'loading',
      data: current.data,
      lastLoadedAt: current.lastLoadedAt,
    });

    this.api.get<Product[]>(environment.api.endpoints.dukanzProduct).subscribe({
      next: (data) => {
        const products = Array.isArray(data) ? data : [];
        this.stateSubject.next({
          status: products.length > 0 ? 'ready' : 'empty',
          data: products,
          lastLoadedAt: new Date().toISOString(),
        });
      },
      error: () => {
        this.stateSubject.next({
          status: 'error',
          data: [],
          error: 'Product data could not be loaded from DukanzProduct.',
          lastLoadedAt: new Date().toISOString(),
        });
      },
    });
  }

  create(request: CreateProductRequest): Observable<unknown> {
    return this.api.post<unknown>(environment.api.endpoints.dukanzProduct, this.toCreatePayload(request));
  }

  update(request: UpdateProductRequest): Observable<unknown> {
    return this.api.put<unknown>(environment.api.endpoints.dukanzProduct, this.toUpdatePayload(request));
  }

  delete(id: string): Observable<unknown> {
    const endpoint = environment.api.endpoints.dukanzProduct;
    const encodedId = encodeURIComponent(id);

    return this.api.delete<unknown>(`${endpoint}/${encodedId}`).pipe(
      catchError((error: unknown) => {
        const status = (error as { status?: number })?.status;
        if (status === 404 || status === 405) {
          return this.api.delete<unknown>(endpoint, { params: { id } });
        }

        return throwError(() => error);
      }),
    );
  }

  getSnapshot(): ResourceState<Product[]> {
    return this.stateSubject.value;
  }

  private toCreatePayload(request: CreateProductRequest): Product {
    const id = request.id ?? this.newGuid();
    const category = this.toCategoryReference(request.productCategoryId, request.productCategoryName);

    return {
      id,
      PartitionKey: id,
      partitionKey: id,
      productName: request.productName.trim(),
      productDescription: request.productDescription?.trim() || '',
      orignalPrice: Number(request.orignalPrice),
      currentPrice: Number(request.currentPrice),
      currentCost: Number(request.currentCost),
      unitName: request.unitName.trim(),
      displayPercentage: Number(request.displayPercentage),
      displayUnitName: request.displayUnitName?.trim() || '',
      imageURL: request.imageURL?.trim() || '',
      visible: request.visible,
      order: Number(request.order),
      productCategoryId: request.productCategoryId,
      productCategory: category,
    };
  }

  private toUpdatePayload(request: UpdateProductRequest): Product {
    const id = request.id;
    const category = this.toCategoryReference(request.productCategoryId, request.productCategoryName);

    return {
      id,
      PartitionKey: id,
      partitionKey: id,
      productName: request.productName.trim(),
      productDescription: request.productDescription?.trim() || '',
      orignalPrice: Number(request.orignalPrice),
      currentPrice: Number(request.currentPrice),
      currentCost: Number(request.currentCost),
      unitName: request.unitName.trim(),
      displayPercentage: Number(request.displayPercentage),
      displayUnitName: request.displayUnitName?.trim() || '',
      imageURL: request.imageURL?.trim() || '',
      visible: request.visible,
      order: Number(request.order),
      productCategoryId: request.productCategoryId,
      productCategory: category,
    };
  }

  private toCategoryReference(id: string, name?: string): ProductCategoryReference {
    return {
      id,
      PartitionKey: id,
      partitionKey: id,
      productCategoryName: name?.trim() || undefined,
    };
  }

  private newGuid(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = Math.trunc(Math.random() * 16);
      const value = char === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }
}
