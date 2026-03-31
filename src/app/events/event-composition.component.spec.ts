import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';

import { EventCompositionComponent } from './event-composition.component';
import { EventCategoryService } from '../services/event-category.service';
import { EventProductService } from '../services/event-product.service';
import { EventService } from '../services/event.service';
import { ProductCategoryService } from '../services/product-category.service';
import { ProductService } from '../services/product.service';

describe('EventCompositionComponent', () => {
  let component: EventCompositionComponent;
  let fixture: ComponentFixture<EventCompositionComponent>;
  let queryParamMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let router: jasmine.SpyObj<Router>;
  let eventCategoryService: jasmine.SpyObj<EventCategoryService>;
  let eventProductService: jasmine.SpyObj<EventProductService>;

  beforeEach(async () => {
    queryParamMap$ = new BehaviorSubject(convertToParamMap({ event: 'event-1', category: 'event-category-1' }));
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    eventCategoryService = jasmine.createSpyObj<EventCategoryService>('EventCategoryService', ['getByEvent', 'update', 'delete', 'create']);
    eventProductService = jasmine.createSpyObj<EventProductService>('EventProductService', ['getByEventCategory', 'update', 'delete', 'create']);

    eventCategoryService.getByEvent.and.returnValue(of([
      {
        id: 'event-category-1',
        eventId: 'event-1',
        productCategoryId: 'category-1',
        visible: true,
        order: 0
      }
    ]));
    eventProductService.getByEventCategory.and.returnValue(of([
      {
        id: 'event-product-1',
        eventId: 'event-1',
        eventCategoryId: 'event-category-1',
        productId: 'product-1',
        visible: true,
        order: 0
      }
    ]));

    await TestBed.configureTestingModule({
      declarations: [EventCompositionComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParamMap$.asObservable()
          }
        },
        { provide: Router, useValue: router },
        {
          provide: EventService,
          useValue: {
            getAll: () => of([
              {
                id: 'event-1',
                eventName: 'Event One',
                lifecycleStatus: 'draft'
              },
              {
                id: 'event-2',
                eventName: 'Event Two',
                lifecycleStatus: 'scheduled'
              }
            ])
          }
        },
        { provide: EventCategoryService, useValue: eventCategoryService },
        { provide: EventProductService, useValue: eventProductService },
        {
          provide: ProductCategoryService,
          useValue: {
            getAll: () => of([
              {
                id: 'category-1',
                productCategoryName: 'Coffee',
                visible: true,
                order: 0
              }
            ])
          }
        },
        {
          provide: ProductService,
          useValue: {
            getAll: () => of([
              {
                id: 'product-1',
                productName: 'Latte',
                productDescription: 'Milk coffee',
                orignalPrice: 6,
                currentPrice: 5,
                currentCost: 2,
                unitName: 'cup',
                visible: true,
                productCategory: {
                  id: 'category-1',
                  productCategoryName: 'Coffee',
                  visible: true,
                  order: 0
                }
              }
            ])
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EventCompositionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('restores event and category selection from query params', () => {
    expect(component.selectedEvent?.id).toBe('event-1');
    expect(component.selectedCategory?.id).toBe('event-category-1');
    expect(component.eventProducts.length).toBe(1);
    expect(eventCategoryService.getByEvent).toHaveBeenCalledWith('event-1');
    expect(eventProductService.getByEventCategory).toHaveBeenCalledWith('event-category-1');
  });

  it('clears category selection when a different event is selected', () => {
    component.selectEvent({
      id: 'event-2',
      eventName: 'Event Two',
      lifecycleStatus: 'scheduled'
    });

    expect(router.navigate).toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: {
        event: 'event-2',
        category: null
      }
    }));
  });

  it('persists reordered category positions', () => {
    eventCategoryService.update.and.callFake((payload) => of({
      id: payload.id || '',
      eventId: payload.eventId || '',
      productCategoryId: payload.productCategoryId,
      visible: payload.visible,
      order: payload.order
    }));

    component['eventCategories'] = [
      {
        id: 'event-category-1',
        eventId: 'event-1',
        productCategoryId: 'category-1',
        visible: true,
        order: 0,
        masterCategory: {
          id: 'category-1',
          productCategoryName: 'Coffee',
          visible: true,
          order: 0
        }
      },
      {
        id: 'event-category-2',
        eventId: 'event-1',
        productCategoryId: 'category-2',
        visible: true,
        order: 1,
        masterCategory: {
          id: 'category-2',
          productCategoryName: 'Tea',
          visible: true,
          order: 1
        }
      }
    ];

    component.onCategoryDrop({
      previousIndex: 0,
      currentIndex: 1
    } as never);

    expect(eventCategoryService.update).toHaveBeenCalledTimes(2);
    expect(eventCategoryService.update.calls.argsFor(0)[0].order).toBe(0);
    expect(eventCategoryService.update.calls.argsFor(1)[0].order).toBe(1);
  });
});
