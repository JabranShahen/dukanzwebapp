import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { environment } from '../../environments/environment';
import { ApiService } from './api-service';
import { DukanzConfigService } from './dukanz-config.service';

describe('DukanzConfigService', () => {
  let api: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let service: DukanzConfigService;

  beforeEach(() => {
    api = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };
    service = new DukanzConfigService(api as unknown as ApiService);
  });

  it('normalizes list payload into active config record', () => {
    api.get.mockReturnValue(
      of([
        {
          id: 'cfg-1',
          message: 'Welcome',
          deliveryCharges: 2,
          minOrderSize: 10,
          maxOrderSize: 200,
          freeDeliveryOrderSize: 80,
          cutoffTime: '17:00',
          maxNumberOfActiveOrders: 20,
          minOrderActiveScreenPresenseHours: 4,
          maxNumberOfHistoryOrders: 100,
          contactPhoneNumber: '+44',
        },
      ]),
    );

    service.load();

    expect(service.getSnapshot().status).toBe('ready');
    expect(service.getSnapshot().data?.id).toBe('cfg-1');
  });

  it('marks empty when config payload is empty', () => {
    api.get.mockReturnValue(of([]));

    service.load();

    expect(service.getSnapshot().status).toBe('empty');
    expect(service.getSnapshot().data).toBeNull();
  });

  it('initializes config and surfaces errors', () => {
    api.post.mockReturnValue(of({ id: 'cfg-1' }));

    service.initialize({
      message: 'Welcome',
      deliveryCharges: 2,
      minOrderSize: 10,
      maxOrderSize: 200,
      freeDeliveryOrderSize: 80,
      cutoffTime: '17:00',
      maxNumberOfActiveOrders: 20,
      minOrderActiveScreenPresenseHours: 4,
      maxNumberOfHistoryOrders: 100,
      contactPhoneNumber: '+44',
    }).subscribe();

    expect(api.post).toHaveBeenCalledWith(
      environment.api.endpoints.dukanzConfig,
      expect.objectContaining({
        id: expect.any(String),
        PartitionKey: expect.any(String),
      }),
    );

    api.post.mockReturnValue(throwError(() => ({ status: 500 })));

    let capturedError: unknown;
    service.initialize({
      message: 'Welcome',
      deliveryCharges: 2,
      minOrderSize: 10,
      maxOrderSize: 200,
      freeDeliveryOrderSize: 80,
      cutoffTime: '17:00',
      maxNumberOfActiveOrders: 20,
      minOrderActiveScreenPresenseHours: 4,
      maxNumberOfHistoryOrders: 100,
      contactPhoneNumber: '+44',
    }).subscribe({
      error: (error) => {
        capturedError = error;
      },
    });

    expect(capturedError).toBeTruthy();
  });

  it('updates config and surfaces errors', () => {
    api.put.mockReturnValue(of({ updated: true }));

    service.update({
      id: 'cfg-1',
      message: 'Welcome',
      deliveryCharges: 2,
      minOrderSize: 10,
      maxOrderSize: 200,
      freeDeliveryOrderSize: 80,
      cutoffTime: '17:00',
      maxNumberOfActiveOrders: 20,
      minOrderActiveScreenPresenseHours: 4,
      maxNumberOfHistoryOrders: 100,
      contactPhoneNumber: '+44',
    }).subscribe();

    expect(api.put).toHaveBeenCalledWith(
      environment.api.endpoints.dukanzConfig,
      expect.objectContaining({
        id: 'cfg-1',
        PartitionKey: 'cfg-1',
      }),
    );

    api.put.mockReturnValue(throwError(() => ({ status: 500 })));

    let capturedError: unknown;
    service.update({
      id: 'cfg-1',
      message: 'Welcome',
      deliveryCharges: 2,
      minOrderSize: 10,
      maxOrderSize: 200,
      freeDeliveryOrderSize: 80,
      cutoffTime: '17:00',
      maxNumberOfActiveOrders: 20,
      minOrderActiveScreenPresenseHours: 4,
      maxNumberOfHistoryOrders: 100,
      contactPhoneNumber: '+44',
    }).subscribe({
      error: (error) => {
        capturedError = error;
      },
    });

    expect(capturedError).toBeTruthy();
  });
});
