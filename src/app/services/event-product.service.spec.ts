import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { EventProductService } from './event-product.service';
import { EventService } from './event.service';

describe('EventProductService', () => {
  let service: EventProductService;
  let eventService: jasmine.SpyObj<EventService>;

  beforeEach(() => {
    eventService = jasmine.createSpyObj<EventService>('EventService', ['getAll', 'update']);

    TestBed.configureTestingModule({
      providers: [
        EventProductService,
        { provide: EventService, useValue: eventService }
      ]
    });

    service = TestBed.inject(EventProductService);
  });

  it('maps missing aggregate products to an empty array', () => {
    let resultLength = -1;
    eventService.getAll.and.returnValue(of([
      { id: 'event-1', eventName: 'Event', lifecycleStatus: 'draft', order: 0, categories: [] }
    ]));

    service.getByEventCategory('event-category-1').subscribe((assignments) => {
      resultLength = assignments.length;
    });

    expect(eventService.getAll).toHaveBeenCalled();
    expect(resultLength).toBe(0);
  });

  it('creates an event-product assignment through the aggregate event contract', () => {
    let result: unknown;
    eventService.getAll.and.returnValue(of([
      {
        id: 'event-1',
        eventName: 'Event',
        lifecycleStatus: 'draft',
        order: 0,
        categories: [
          {
            id: 'event-category-1',
            eventId: 'event-1',
            productCategoryId: 'category-1',
            categoryName: 'Tea',
            visible: true,
            order: 0,
            products: []
          }
        ]
      }
    ] as never));
    eventService.update.and.callFake((payload) => of({
      id: 'event-1',
      eventName: 'Event',
      lifecycleStatus: 'draft',
      order: 0,
      categories: payload.categories
    } as never));

    service.create({
      id: 'assignment-1',
      eventId: '  event-1  ',
      eventCategoryId: '  event-category-1  ',
      productId: '  product-2  ',
      overrideImageURL: '  dukanz/event-products/tea.png  ',
      orignalPrice: 12.5,
      currentPrice: 10.25,
      currentCost: 7.75,
      unitName: ' cup ',
      visible: true,
      order: 3
    }).subscribe((assignment) => {
      result = assignment;
    });

    expect(eventService.update).toHaveBeenCalled();
    const payload = eventService.update.calls.argsFor(0)[0];
    expect(payload.categories?.[0].products?.[0].eventId).toBe('event-1');
    expect(payload.categories?.[0].products?.[0].eventCategoryId).toBe('event-category-1');
    expect(payload.categories?.[0].products?.[0].productId).toBe('product-2');
    expect(payload.categories?.[0].products?.[0].imageURL).toBe('dukanz/event-products/tea.png');
    expect(payload.categories?.[0].products?.[0].unitName).toBe('cup');
    expect((result as any).overrideImageURL).toBe('dukanz/event-products/tea.png');
  });

  it('returns false when the aggregate event product does not exist', () => {
    let deleted: boolean | undefined;
    eventService.getAll.and.returnValue(of([
      { id: 'event-1', eventName: 'Event', lifecycleStatus: 'draft', order: 0, categories: [] }
    ]));

    service.delete('assignment-1').subscribe((result) => {
      deleted = result;
    });

    expect(eventService.update).not.toHaveBeenCalled();
    expect(deleted).toBeFalse();
  });
});
