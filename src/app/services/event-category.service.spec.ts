import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { EventCategoryService } from './event-category.service';
import { EventService } from './event.service';

describe('EventCategoryService', () => {
  let service: EventCategoryService;
  let eventService: jasmine.SpyObj<EventService>;

  beforeEach(() => {
    eventService = jasmine.createSpyObj<EventService>('EventService', ['getAll', 'update']);

    TestBed.configureTestingModule({
      providers: [
        EventCategoryService,
        { provide: EventService, useValue: eventService }
      ]
    });

    service = TestBed.inject(EventCategoryService);
  });

  it('maps missing aggregate categories to an empty array', () => {
    let resultLength = -1;
    eventService.getAll.and.returnValue(of([{ id: 'event-1', eventName: 'Event', lifecycleStatus: 'draft', order: 0 }]));

    service.getByEvent('event-1').subscribe((assignments) => {
      resultLength = assignments.length;
    });

    expect(eventService.getAll).toHaveBeenCalled();
    expect(resultLength).toBe(0);
  });

  it('creates an event-category assignment through the aggregate event contract', () => {
    let result: unknown;
    eventService.getAll.and.returnValue(of([
      { id: 'event-1', eventName: 'Event', lifecycleStatus: 'draft', order: 0, categories: [] }
    ]));
    eventService.update.and.callFake((payload) => of({
      id: 'event-1',
      eventName: 'Event',
      lifecycleStatus: 'draft',
      order: 0,
      categories: payload.categories
    } as never));

    service.create({
      eventId: '  event-1  ',
      productCategoryId: '  category-2  ',
      overrideImageURL: '  dukanz/event-categories/tea.png  ',
      visible: true,
      order: 3
    }).subscribe((assignment) => {
      result = assignment;
    });

    expect(eventService.update).toHaveBeenCalled();
    const payload = eventService.update.calls.argsFor(0)[0];
    expect(payload.id).toBe('event-1');
    expect(payload.categories?.[0].eventId).toBe('event-1');
    expect(payload.categories?.[0].productCategoryId).toBe('category-2');
    expect(payload.categories?.[0].imageURL).toBe('dukanz/event-categories/tea.png');
    expect(payload.categories?.[0].order).toBe(3);
    expect((result as any).eventId).toBe('event-1');
    expect((result as any).productCategoryId).toBe('category-2');
    expect((result as any).overrideImageURL).toBe('dukanz/event-categories/tea.png');
  });

  it('returns false when the aggregate event category does not exist', () => {
    let deleted: boolean | undefined;
    eventService.getAll.and.returnValue(of([{ id: 'event-1', eventName: 'Event', lifecycleStatus: 'draft', order: 0, categories: [] }]));

    service.delete('assignment-1').subscribe((result) => {
      deleted = result;
    });

    expect(eventService.update).not.toHaveBeenCalled();
    expect(deleted).toBeFalse();
  });
});
