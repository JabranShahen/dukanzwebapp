import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PurchaseCreateComponent } from './purchase-create.component';
import { PurchaseService } from '../services/purchase.service';
import { OrderService } from '../services/order.service';

describe('PurchaseCreateComponent — toggleOrders', () => {
  let component: PurchaseCreateComponent;
  let fixture: ComponentFixture<PurchaseCreateComponent>;
  let purchaseService: jasmine.SpyObj<PurchaseService>;
  let orderService: jasmine.SpyObj<OrderService>;

  const previewWithOrders = {
    windowStart: '2026-05-04T00:00:00',
    windowEnd: '2026-05-04T23:00:00',
    windowClosed: true,
    purchaseDateKey: '2026-05-04',
    deliveryDate: '2026-05-05T00:00:00',
    orderCount: 2,
    alreadyCreated: false,
    orderIds: ['order-a', 'order-b'],
    categories: []
  };

  const fakeOrders = [
    { id: 'order-a', status: 'Approved', orderGrossPrice: 100, user: { id: 'u1', name: 'Alice', address: 'Addr1', phoneNumber: '0300' }, orderItems: [] },
    { id: 'order-b', status: 'Packed', orderGrossPrice: 200, user: { id: 'u2', name: 'Bob', address: 'Addr2', phoneNumber: '0301' }, orderItems: [] }
  ];

  beforeEach(async () => {
    purchaseService = jasmine.createSpyObj<PurchaseService>('PurchaseService', ['getPreview', 'createPurchase']);
    orderService = jasmine.createSpyObj<OrderService>('OrderService', ['getOrdersByIds']);

    purchaseService.getPreview.and.returnValue(of(previewWithOrders as any));
    orderService.getOrdersByIds.and.returnValue(of(fakeOrders as any));

    await TestBed.configureTestingModule({
      declarations: [PurchaseCreateComponent],
      providers: [
        { provide: PurchaseService, useValue: purchaseService },
        { provide: OrderService, useValue: orderService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(PurchaseCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('calls getOrdersByIds with the preview orderIds on first View Orders click', () => {
    component.toggleOrders();

    expect(orderService.getOrdersByIds).toHaveBeenCalledOnceWith(['order-a', 'order-b']);
    expect(component.showOrders).toBeTrue();
    expect(component.orders.length).toBe(2);
  });

  it('does not call getOrdersByIds on second click when orders are cached', () => {
    component.toggleOrders();
    component.toggleOrders();
    component.toggleOrders();

    expect(orderService.getOrdersByIds).toHaveBeenCalledTimes(1);
    expect(component.showOrders).toBeTrue();
  });

  it('collapses the panel on second click without re-fetching', () => {
    component.toggleOrders();
    expect(component.showOrders).toBeTrue();

    component.toggleOrders();
    expect(component.showOrders).toBeFalse();
    expect(orderService.getOrdersByIds).toHaveBeenCalledTimes(1);
  });

  it('resets orders cache after Refresh so next View Orders re-fetches', () => {
    component.toggleOrders();
    expect(orderService.getOrdersByIds).toHaveBeenCalledTimes(1);

    component.loadPreview();
    component.toggleOrders();

    expect(orderService.getOrdersByIds).toHaveBeenCalledTimes(2);
  });
});
