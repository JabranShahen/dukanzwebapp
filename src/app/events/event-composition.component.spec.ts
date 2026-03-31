import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';

import { EventCompositionComponent } from './event-composition.component';
import { BlobStorageService } from '../services/blob-storage.service';
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
        overrideImageURL: '',
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
        overrideImageURL: '',
        orignalPrice: 6,
        currentPrice: 5,
        currentCost: 2,
        unitName: 'cup',
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
                imageURL: 'dukanz/events/event-one.png',
                lifecycleStatus: 'draft'
              },
              {
                id: 'event-2',
                eventName: 'Event Two',
                imageURL: '',
                lifecycleStatus: 'scheduled'
              }
            ])
          }
        },
        { provide: EventCategoryService, useValue: eventCategoryService },
        { provide: EventProductService, useValue: eventProductService },
        {
          provide: BlobStorageService,
          useValue: {
            getDownloadUrl: () => of('https://img.test/resolved.png'),
            uploadImage: () => of('dukanz/uploaded.png')
          }
        },
        {
          provide: ProductCategoryService,
          useValue: {
            getAll: () => of([
              {
                id: 'category-1',
                productCategoryName: 'Coffee',
                productCategoryImageURL: 'dukanz/categories/coffee.png',
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
                imageURL: 'dukanz/products/latte.png',
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
        overrideImageURL: '',
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
        overrideImageURL: '',
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

  it('adds a saved category locally without reloading the category list', () => {
    eventCategoryService.create.and.returnValue(of({
      id: 'event-category-2',
      eventId: 'event-1',
      productCategoryId: 'category-2',
      overrideImageURL: '',
      visible: true,
      order: 1
    }));

    component.masterCategories = [
      {
        id: 'category-1',
        productCategoryName: 'Coffee',
        productCategoryImageURL: 'dukanz/categories/coffee.png',
        visible: true,
        order: 0
      },
      {
        id: 'category-2',
        productCategoryName: 'Tea',
        productCategoryImageURL: '',
        visible: true,
        order: 1
      }
    ];

    const initialGetByEventCalls = eventCategoryService.getByEvent.calls.count();
    component.categoryModalMode = 'add';
    component.onSaveCategoryAssignment({
      productCategoryId: 'category-2',
      overrideImageURL: '',
      visible: true,
      order: 0
    });

    expect(eventCategoryService.create).toHaveBeenCalledWith(jasmine.objectContaining({
      eventId: 'event-1',
      productCategoryId: 'category-2',
      overrideImageURL: '',
      order: 1
    }));
    expect(component.eventCategories.map((assignment) => assignment.id)).toEqual(['event-category-1', 'event-category-2']);
    expect(eventCategoryService.getByEvent.calls.count()).toBe(initialGetByEventCalls);
  });

  it('adds a saved product locally without reloading the product list', () => {
    eventProductService.create.and.returnValue(of({
      id: 'event-product-2',
      eventId: 'event-1',
      eventCategoryId: 'event-category-1',
      productId: 'product-2',
      overrideImageURL: '',
      orignalPrice: 6,
      currentPrice: 5.5,
      currentCost: 2.4,
      unitName: 'cup',
      visible: true,
      order: 1
    }));

    component.masterProducts = [
      {
        id: 'product-1',
        productName: 'Latte',
        productDescription: 'Milk coffee',
        orignalPrice: 6,
        currentPrice: 5,
        currentCost: 2,
        unitName: 'cup',
        imageURL: 'dukanz/products/latte.png',
        visible: true,
        productCategory: {
          id: 'category-1',
          productCategoryName: 'Coffee',
          visible: true,
          order: 0
        }
      },
      {
        id: 'product-2',
        productName: 'Flat White',
        productDescription: 'Velvety coffee',
        orignalPrice: 6,
        currentPrice: 5.5,
        currentCost: 2.4,
        unitName: 'cup',
        imageURL: '',
        visible: true,
        productCategory: {
          id: 'category-1',
          productCategoryName: 'Coffee',
          visible: true,
          order: 0
        }
      }
    ];

    const initialGetByEventCategoryCalls = eventProductService.getByEventCategory.calls.count();
    component.productModalMode = 'add';
    component.onSaveProductAssignment({
      productId: 'product-2',
      overrideImageURL: '',
      orignalPrice: 6,
      currentPrice: 5.5,
      currentCost: 2.4,
      unitName: 'cup',
      visible: true,
      order: 0
    });

    expect(eventProductService.create).toHaveBeenCalledWith(jasmine.objectContaining({
      eventId: 'event-1',
      eventCategoryId: 'event-category-1',
      productId: 'product-2',
      overrideImageURL: '',
      orignalPrice: 6,
      currentPrice: 5.5,
      currentCost: 2.4,
      unitName: 'cup',
      order: 1
    }));
    expect(component.eventProducts.map((assignment) => assignment.id)).toEqual(['event-product-1', 'event-product-2']);
    expect(eventProductService.getByEventCategory.calls.count()).toBe(initialGetByEventCategoryCalls);
  });

  it('clears stale assigned categories when switching to another event before its categories finish loading', () => {
    component.masterCategories = [
      {
        id: 'category-1',
        productCategoryName: 'Coffee',
        productCategoryImageURL: 'dukanz/categories/coffee.png',
        visible: true,
        order: 0
      },
      {
        id: 'category-2',
        productCategoryName: 'Tea',
        productCategoryImageURL: '',
        visible: true,
        order: 1
      }
    ];
    component['eventCategories'] = [
      {
        id: 'event-category-1',
        eventId: 'event-1',
        productCategoryId: 'category-1',
        overrideImageURL: '',
        visible: true,
        order: 0,
        masterCategory: {
          id: 'category-1',
          productCategoryName: 'Coffee',
          visible: true,
          order: 0
        }
      }
    ];

    const pendingCategories = new Subject<any[]>();
    eventCategoryService.getByEvent.and.returnValue(pendingCategories.asObservable());

    queryParamMap$.next(convertToParamMap({ event: 'event-2', category: null }));

    expect(component.selectedEvent?.id).toBe('event-2');
    expect(component.eventCategories).toEqual([]);
    expect(component.availableCategories().map((category) => category.id)).toEqual(['category-1', 'category-2']);
  });
});
