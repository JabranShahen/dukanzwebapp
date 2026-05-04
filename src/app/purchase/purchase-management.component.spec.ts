import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';

import { OrderService } from '../services/order.service';
import { PurchaseService } from '../services/purchase.service';
import { PurchaseManagementComponent } from './purchase-management.component';

describe('PurchaseManagementComponent', () => {
  let component: PurchaseManagementComponent;
  let fixture: ComponentFixture<PurchaseManagementComponent>;
  let purchaseService: jasmine.SpyObj<PurchaseService>;
  let orderService: jasmine.SpyObj<OrderService>;

  const preview = {
    windowStart: '2026-05-03T23:00:00',
    windowEnd: '2026-05-04T23:00:00',
    windowClosed: true,
    purchaseDateKey: '2026-05-03',
    deliveryDate: '2026-05-04T00:00:00',
    orderCount: 2,
    alreadyCreated: false,
    orderIds: ['order-a', 'order-b'],
    categories: []
  };

  const summaries = [
    {
      id: '2026-05-03-abcdef12',
      purchDate: '2026-05-04T09:00:00',
      status: 'Pending',
      total: 250,
      itemCount: 4,
      orderCount: 2
    }
  ];

  const detail = {
    id: '2026-05-03-abcdef12',
    purchDate: '2026-05-04T09:00:00',
    status: 'Pending',
    total: 0,
    items: [
      {
        id: 'item-1',
        productId: 'product-1',
        productName: 'Apples',
        unitName: 'kg',
        categoryName: 'Fruit',
        quantity: 3,
        pricePerQty: 10,
        totalPrice: 30,
        status: 'Pending'
      }
    ]
  };

  beforeEach(async () => {
    purchaseService = jasmine.createSpyObj<PurchaseService>('PurchaseService', [
      'getPreview',
      'createPurchase',
      'listPurchases',
      'getPurchase',
      'getOrdersForPurchase',
      'processPurchase',
      'deletePurchase'
    ]);
    orderService = jasmine.createSpyObj<OrderService>('OrderService', ['getOrdersByIds']);

    purchaseService.getPreview.and.returnValue(of(preview as any));
    purchaseService.listPurchases.and.returnValue(of(summaries as any));
    purchaseService.createPurchase.and.returnValue(of({ id: summaries[0].id }));
    purchaseService.getPurchase.and.returnValue(of(detail as any));
    purchaseService.getOrdersForPurchase.and.returnValue(of([
      {
        id: 'order-a',
        customerName: 'Alice',
        customerPhone: '0300',
        address: 'Address',
        status: 'Approved',
        total: 100,
        itemCount: 1
      }
    ] as any));
    purchaseService.processPurchase.and.returnValue(of(true));
    purchaseService.deletePurchase.and.returnValue(of(true));
    orderService.getOrdersByIds.and.returnValue(of([
      { id: 'order-a', status: 'Approved', orderGrossPrice: 100, user: { name: 'Alice' }, orderItems: [] }
    ] as any));

    await TestBed.configureTestingModule({
      declarations: [PurchaseManagementComponent],
      providers: [
        { provide: PurchaseService, useValue: purchaseService },
        { provide: OrderService, useValue: orderService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(PurchaseManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads preview and current-window purchase history on init', () => {
    expect(purchaseService.getPreview).toHaveBeenCalled();
    expect(purchaseService.listPurchases).toHaveBeenCalled();
    expect(component.preview).toEqual(preview as any);
    expect(component.summaries.length).toBe(1);
  });

  it('fetches preview orders with the preview order ids', () => {
    component.togglePreviewOrders();

    expect(orderService.getOrdersByIds).toHaveBeenCalledOnceWith(['order-a', 'order-b']);
    expect(component.showPreviewOrders).toBeTrue();
    expect(component.previewOrders.length).toBe(1);
  });

  it('reloads preview and list after creating a purchase', () => {
    component.onCreatePurchase();

    expect(purchaseService.createPurchase).toHaveBeenCalled();
    expect(purchaseService.getPreview).toHaveBeenCalledTimes(2);
    expect(purchaseService.listPurchases).toHaveBeenCalledTimes(2);
  });

  it('switches to process detail view and builds editable groups', () => {
    component.openProcess(summaries[0].id);

    expect(component.viewMode).toBe('process');
    expect(component.processingPurchaseId).toBe(summaries[0].id);
    expect(purchaseService.getPurchase).toHaveBeenCalledOnceWith(summaries[0].id);
    expect(component.groups.length).toBe(1);
  });

  it('returns to list mode and reloads both sections', () => {
    component.openProcess(summaries[0].id);
    component.backToList();

    expect(component.viewMode).toBe('list');
    expect(component.processingPurchaseId).toBeNull();
    expect(component.detail).toBeNull();
    expect(purchaseService.getPreview).toHaveBeenCalledTimes(2);
    expect(purchaseService.listPurchases).toHaveBeenCalledTimes(2);
  });

  it('stores summary-row orders by purchase id', () => {
    component.toggleSummaryOrders(summaries[0].id);

    expect(purchaseService.getOrdersForPurchase).toHaveBeenCalledOnceWith(summaries[0].id);
    expect(component.expandedSummaryOrderIds.has(summaries[0].id)).toBeTrue();
    expect(component.summaryOrdersByPurchaseId.get(summaries[0].id)?.length).toBe(1);
  });

  it('sets deleting state and reloads both sections after delete completes', () => {
    const deleted = new Subject<boolean>();
    purchaseService.deletePurchase.and.returnValue(deleted.asObservable());

    component.onDelete(summaries[0].id);
    expect(component.deletingId).toBe(summaries[0].id);

    deleted.next(true);
    deleted.complete();

    expect(component.deletingId).toBeNull();
    expect(purchaseService.getPreview).toHaveBeenCalledTimes(2);
    expect(purchaseService.listPurchases).toHaveBeenCalledTimes(2);
  });
});
