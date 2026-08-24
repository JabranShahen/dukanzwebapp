import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { environment } from '../../environments/environment';
import { ApiService } from './api-service';
import { DukanzProductService } from './dukanz-product.service';

describe('DukanzProductService', () => {
  let api: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let service: DukanzProductService;

  beforeEach(() => {
    api = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    service = new DukanzProductService(api as unknown as ApiService);
  });

  it('creates product successfully', () => {
    api.post.mockReturnValue(of({ id: 'prod-1' }));

    service.create({
      productName: 'Beans',
      productDescription: 'Desc',
      productCategoryId: 'coffee',
      productCategoryName: 'Coffee',
      orignalPrice: 10,
      currentPrice: 9,
      currentCost: 6,
      unitName: 'bag',
      displayPercentage: 100,
      displayUnitName: 'bag',
      imageURL: '',
      visible: true,
      order: 1,
    }).subscribe();

    expect(api.post).toHaveBeenCalledWith(
      environment.api.endpoints.dukanzProduct,
      expect.objectContaining({
        id: expect.any(String),
        PartitionKey: expect.any(String),
        productName: 'Beans',
        productCategory: expect.objectContaining({ id: 'coffee' }),
      }),
    );
  });

  it('surfaces create errors', () => {
    api.post.mockReturnValue(throwError(() => ({ status: 500 })));

    let capturedError: unknown;
    service.create({
      productName: 'Beans',
      productCategoryId: 'coffee',
      orignalPrice: 10,
      currentPrice: 9,
      currentCost: 6,
      unitName: 'bag',
      displayPercentage: 100,
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

  it('updates product successfully', () => {
    api.put.mockReturnValue(of({ updated: true }));

    service.update({
      id: 'prod-1',
      productName: 'Beans',
      productDescription: 'Desc',
      productCategoryId: 'coffee',
      productCategoryName: 'Coffee',
      orignalPrice: 10,
      currentPrice: 9,
      currentCost: 6,
      unitName: 'bag',
      displayPercentage: 100,
      displayUnitName: 'bag',
      imageURL: '',
      visible: true,
      order: 2,
    }).subscribe();

    expect(api.put).toHaveBeenCalledWith(
      environment.api.endpoints.dukanzProduct,
      expect.objectContaining({
        id: 'prod-1',
        PartitionKey: 'prod-1',
        order: 2,
      }),
    );
  });

  it('surfaces update errors', () => {
    api.put.mockReturnValue(throwError(() => ({ status: 500 })));

    let capturedError: unknown;
    service.update({
      id: 'prod-1',
      productName: 'Beans',
      productCategoryId: 'coffee',
      orignalPrice: 10,
      currentPrice: 9,
      currentCost: 6,
      unitName: 'bag',
      displayPercentage: 100,
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

  it('deletes product successfully', () => {
    api.delete.mockReturnValue(of({ deleted: true }));

    service.delete('prod-1').subscribe();

    expect(api.delete).toHaveBeenCalledWith(`${environment.api.endpoints.dukanzProduct}/prod-1`);
  });

  it('retries delete using query parameter when path delete is not found', () => {
    api.delete.mockReturnValueOnce(throwError(() => ({ status: 404 }))).mockReturnValueOnce(of({ deleted: true }));

    service.delete('prod-1').subscribe();

    expect(api.delete).toHaveBeenNthCalledWith(1, `${environment.api.endpoints.dukanzProduct}/prod-1`);
    expect(api.delete).toHaveBeenNthCalledWith(2, environment.api.endpoints.dukanzProduct, { params: { id: 'prod-1' } });
  });

  it('surfaces delete errors', () => {
    api.delete.mockReturnValue(throwError(() => ({ status: 500 })));

    let capturedError: unknown;
    service.delete('prod-1').subscribe({
      error: (error) => {
        capturedError = error;
      },
    });

    expect(api.delete).toHaveBeenCalled();
    expect(capturedError).toBeTruthy();
  });
});
