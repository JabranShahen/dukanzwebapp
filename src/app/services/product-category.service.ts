import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { CreateProductCategoryRequest, ProductCategory, UpdateProductCategoryRequest } from '../entities/product-category';
import { ApiService } from './api-service';
import { createIdleState, ResourceState } from './resource-state';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductCategoryService {
  private readonly stateSubject = new BehaviorSubject<ResourceState<ProductCategory[]>>(createIdleState([]));
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

    this.api.get<ProductCategory[]>(environment.api.endpoints.productCategory).subscribe({
      next: (data) => {
        const categories = Array.isArray(data) ? data : [];
        this.stateSubject.next({
          status: categories.length > 0 ? 'ready' : 'empty',
          data: categories,
          lastLoadedAt: new Date().toISOString(),
        });
      },
      error: () => {
        this.stateSubject.next({
          status: 'error',
          data: [],
          error: 'Category data could not be loaded from ProductCategory.',
          lastLoadedAt: new Date().toISOString(),
        });
      },
    });
  }

  create(request: CreateProductCategoryRequest): Observable<unknown> {
    return this.api
      .post<unknown>(environment.api.endpoints.productCategory, this.toCreatePayload(request))
      .pipe(catchError((error: unknown) => this.recoverMutationFrom2xxParseError(error)));
  }

  update(request: UpdateProductCategoryRequest): Observable<unknown> {
    const endpoint = environment.api.endpoints.productCategory;
    const payload = this.toUpdatePayload(request);
    return this.api.put<unknown>(endpoint, payload).pipe(
      catchError((error: unknown) => {
        const status = (error as { status?: number })?.status;
        if (status === 404 || status === 405 || status === 415) {
          return this.api.post<unknown>(endpoint, payload);
        }

        return throwError(() => error);
      }),
      catchError((error: unknown) => this.recoverMutationFrom2xxParseError(error)),
    );
  }

  delete(categoryOrId: ProductCategory | string): Observable<unknown> {
    const endpoint = environment.api.endpoints.productCategory;
    const payload = this.toDeletePayload(categoryOrId);
    const id = payload.id;
    const encodedId = encodeURIComponent(id);

    return this.api.delete<unknown>(endpoint, { body: payload }).pipe(
      catchError((error: unknown) => {
        const status = (error as { status?: number })?.status;
        if (status === 400 || status === 404 || status === 405 || status === 415) {
          return this.api.delete<unknown>(endpoint, { params: { id } }).pipe(
            catchError((secondError: unknown) => {
              const secondStatus = (secondError as { status?: number })?.status;
              if (secondStatus === 404 || secondStatus === 405 || secondStatus === 415) {
                return this.api.delete<unknown>(`${endpoint}/${encodedId}`);
              }

              return throwError(() => secondError);
            }),
          );
        }

        return throwError(() => error);
      }),
      catchError((error: unknown) => this.recoverMutationFrom2xxParseError(error)),
    );
  }

  getSnapshot(): ResourceState<ProductCategory[]> {
    return this.stateSubject.value;
  }

  private toCreatePayload(request: CreateProductCategoryRequest): ProductCategory {
    const id = request.id ?? this.newGuid();
    return {
      id,
      PartitionKey: id,
      partitionKey: id,
      productCategoryName: request.productCategoryName.trim(),
      productCategoryImageURL: request.productCategoryImageURL?.trim() || '',
      visible: request.visible,
      order: Number(request.order),
    };
  }

  private toUpdatePayload(request: UpdateProductCategoryRequest): ProductCategory {
    const id = request.id;
    return {
      id,
      PartitionKey: id,
      partitionKey: id,
      productCategoryName: request.productCategoryName.trim(),
      productCategoryImageURL: request.productCategoryImageURL?.trim() || '',
      visible: request.visible,
      order: Number(request.order),
    };
  }

  private toDeletePayload(categoryOrId: ProductCategory | string): ProductCategory {
    if (typeof categoryOrId === 'string') {
      const id = categoryOrId;
      return {
        id,
        PartitionKey: id,
        partitionKey: id,
        productCategoryName: '',
        productCategoryImageURL: '',
        visible: false,
        order: 0,
      };
    }

    const id = categoryOrId.id;
    return {
      ...categoryOrId,
      id,
      PartitionKey: categoryOrId.PartitionKey || id,
      partitionKey: categoryOrId.partitionKey || categoryOrId.PartitionKey || id,
      productCategoryName: categoryOrId.productCategoryName || '',
      productCategoryImageURL: categoryOrId.productCategoryImageURL || '',
      visible: Boolean(categoryOrId.visible),
      order: Number(categoryOrId.order),
    };
  }

  private recoverMutationFrom2xxParseError(error: unknown): Observable<unknown> {
    if (error instanceof HttpErrorResponse && error.status >= 200 && error.status < 300) {
      return of({});
    }

    return throwError(() => error);
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

