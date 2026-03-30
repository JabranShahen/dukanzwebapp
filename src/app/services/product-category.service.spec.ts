import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { ApiService } from './api-service';
import { ProductCategoryService } from './product-category.service';

describe('ProductCategoryService', () => {
  let api: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let service: ProductCategoryService;

  beforeEach(() => {
    api = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    service = new ProductCategoryService(api as unknown as ApiService);
  });

  it('creates category successfully', () => {
    api.post.mockReturnValue(of({ id: 'cat-1' }));

    service.create({
      productCategoryName: 'Bakery',
      productCategoryImageURL: 'https://img',
      visible: true,
      order: 1,
    }).subscribe();

    expect(api.post).toHaveBeenCalledWith(
      environment.api.endpoints.productCategory,
      expect.objectContaining({
        id: expect.any(String),
        PartitionKey: expect.any(String),
        productCategoryName: 'Bakery',
      }),
    );
  });

  it('surfaces create errors', () => {
    api.post.mockReturnValue(throwError(() => ({ status: 500 })));

    let capturedError: unknown;
    service.create({
      productCategoryName: 'Bakery',
      visible: true,
      order: 1,
    }).subscribe({
      error: (error) => {
        capturedError = error;
      },
    });

    expect(api.post).toHaveBeenCalled();
    expect(capturedError).toBeTruthy();
  });

  it('treats 2xx parse errors as successful category create', () => {
    api.post.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 200,
            statusText: 'OK',
            error: 'SyntaxError: Unexpected token',
          }),
      ),
    );

    let completed = false;
    let capturedError: unknown;
    service.create({
      productCategoryName: 'Bakery',
      visible: true,
      order: 1,
    }).subscribe({
      next: () => {
        completed = true;
      },
      error: (error) => {
        capturedError = error;
      },
    });

    expect(api.post).toHaveBeenCalled();
    expect(completed).toBe(true);
    expect(capturedError).toBeUndefined();
  });

  it('updates category successfully', () => {
    api.put.mockReturnValue(of({ updated: true }));

    service.update({
      id: 'cat-1',
      productCategoryName: 'Bakery',
      productCategoryImageURL: '',
      visible: true,
      order: 2,
    }).subscribe();

    expect(api.put).toHaveBeenCalledWith(
      environment.api.endpoints.productCategory,
      expect.objectContaining({
        id: 'cat-1',
        PartitionKey: 'cat-1',
        order: 2,
      }),
    );
  });

  it('retries update using post when put is unsupported', () => {
    api.put.mockReturnValueOnce(throwError(() => ({ status: 405 })));
    api.post.mockReturnValueOnce(of({ updated: true }));

    service.update({
      id: 'cat-1',
      productCategoryName: 'Bakery',
      productCategoryImageURL: '',
      visible: true,
      order: 2,
    }).subscribe();

    expect(api.put).toHaveBeenCalledTimes(1);
    expect(api.post).toHaveBeenCalledWith(
      environment.api.endpoints.productCategory,
      expect.objectContaining({
        id: 'cat-1',
        PartitionKey: 'cat-1',
        order: 2,
      }),
    );
  });

  it('surfaces update errors', () => {
    api.put.mockReturnValue(throwError(() => ({ status: 500 })));

    let capturedError: unknown;
    service.update({
      id: 'cat-1',
      productCategoryName: 'Bakery',
      visible: true,
      order: 1,
    }).subscribe({
      error: (error) => {
        capturedError = error;
      },
    });

    expect(api.put).toHaveBeenCalled();
    expect(capturedError).toBeTruthy();
  });

  it('deletes category successfully', () => {
    api.delete.mockReturnValue(of({ deleted: true }));

    service
      .delete({
        id: 'cat-1',
        productCategoryName: 'Bakery',
        productCategoryImageURL: 'https://img',
        visible: true,
        order: 1,
      })
      .subscribe();

    expect(api.delete).toHaveBeenCalledWith(environment.api.endpoints.productCategory, {
      body: {
        id: 'cat-1',
        PartitionKey: 'cat-1',
        partitionKey: 'cat-1',
        productCategoryName: 'Bakery',
        productCategoryImageURL: 'https://img',
        visible: true,
        order: 1,
      },
    });
  });

  it('retries delete using query parameter when body delete is unsupported', () => {
    api.delete.mockReturnValueOnce(throwError(() => ({ status: 415 }))).mockReturnValueOnce(of({ deleted: true }));

    service.delete('cat-1').subscribe();

    expect(api.delete).toHaveBeenNthCalledWith(1, environment.api.endpoints.productCategory, {
      body: expect.objectContaining({
        id: 'cat-1',
        PartitionKey: 'cat-1',
        partitionKey: 'cat-1',
      }),
    });
    expect(api.delete).toHaveBeenNthCalledWith(2, environment.api.endpoints.productCategory, { params: { id: 'cat-1' } });
  });

  it('retries delete using path parameter when body and query forms are not found', () => {
    api.delete
      .mockReturnValueOnce(throwError(() => ({ status: 404 })))
      .mockReturnValueOnce(throwError(() => ({ status: 404 })))
      .mockReturnValueOnce(of({ deleted: true }));

    service.delete('cat-1').subscribe();

    expect(api.delete).toHaveBeenNthCalledWith(3, `${environment.api.endpoints.productCategory}/cat-1`);
  });

  it('surfaces delete errors', () => {
    api.delete.mockReturnValue(throwError(() => ({ status: 500 })));

    let capturedError: unknown;
    service.delete('cat-1').subscribe({
      error: (error) => {
        capturedError = error;
      },
    });

    expect(api.delete).toHaveBeenCalled();
    expect(capturedError).toBeTruthy();
  });
});


