import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { EventCategoryService } from './event-category.service';
import { environment } from '../environments/environment';

describe('EventCategoryService', () => {
  let service: EventCategoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(EventCategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('maps null event-category lists to an empty array', () => {
    let resultLength = -1;

    service.getByEvent('event-1').subscribe((assignments) => {
      resultLength = assignments.length;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/EventCategory/event/event-1`);
    request.flush(null);

    expect(resultLength).toBe(0);
  });

  it('creates an event-category assignment with normalized payload values', () => {
    let result: unknown;

    service.create({
      eventId: '  event-1  ',
      productCategoryId: '  category-2  ',
      overrideImageURL: '  dukanz/event-categories/tea.png  ',
      visible: true,
      order: 3
    }).subscribe((assignment) => {
      result = assignment;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/EventCategory`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.eventId).toBe('event-1');
    expect(request.request.body.productCategoryId).toBe('category-2');
    expect(request.request.body.overrideImageURL).toBe('dukanz/event-categories/tea.png');
    expect(request.request.body.visible).toBeTrue();
    expect(request.request.body.order).toBe(3);
    expect(request.request.body.PartitionKey).toBe(request.request.body.id);
    expect(request.request.body.partitionKey).toBe(request.request.body.id);

    request.flush({ id: 'assignment-1' });

    expect(result).toEqual({
      id: 'assignment-1',
      partitionKey: 'assignment-1',
      PartitionKey: 'assignment-1',
      eventId: 'event-1',
      productCategoryId: 'category-2',
      overrideImageURL: 'dukanz/event-categories/tea.png',
      visible: true,
      order: 3
    });
  });

  it('returns false when the delete endpoint reports that the assignment was not deleted', () => {
    let deleted: boolean | undefined;

    service.delete('assignment-1').subscribe((result) => {
      deleted = result;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/EventCategory/assignment-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush({ deleted: false });

    expect(deleted).toBeFalse();
  });
});
