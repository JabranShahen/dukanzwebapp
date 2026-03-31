import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { EventProductService } from './event-product.service';
import { environment } from '../environments/environment';

describe('EventProductService', () => {
  let service: EventProductService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(EventProductService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('maps null event-product lists to an empty array', () => {
    let resultLength = -1;

    service.getByEventCategory('event-category-1').subscribe((assignments) => {
      resultLength = assignments.length;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/EventProduct/eventCategory/event-category-1`);
    request.flush(null);

    expect(resultLength).toBe(0);
  });

  it('creates an event-product assignment with normalized payload values', () => {
    let result: unknown;

    service.create({
      id: 'assignment-1',
      eventId: '  event-1  ',
      eventCategoryId: '  event-category-1  ',
      productId: '  product-2  ',
      visible: true,
      order: 3
    }).subscribe((assignment) => {
      result = assignment;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/EventProduct`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.eventId).toBe('event-1');
    expect(request.request.body.eventCategoryId).toBe('event-category-1');
    expect(request.request.body.productId).toBe('product-2');
    expect(request.request.body.visible).toBeTrue();
    expect(request.request.body.order).toBe(3);
    expect(request.request.body.PartitionKey).toBe('assignment-1');
    expect(request.request.body.partitionKey).toBe('assignment-1');

    request.flush({ id: 'assignment-1' });

    expect(result).toEqual({
      id: 'assignment-1',
      partitionKey: 'assignment-1',
      PartitionKey: 'assignment-1',
      eventId: 'event-1',
      eventCategoryId: 'event-category-1',
      productId: 'product-2',
      visible: true,
      order: 3
    });
  });

  it('returns false when the delete endpoint reports that the assignment was not deleted', () => {
    let deleted: boolean | undefined;

    service.delete('assignment-1').subscribe((result) => {
      deleted = result;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/EventProduct/assignment-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush({ deleted: false });

    expect(deleted).toBeFalse();
  });
});
