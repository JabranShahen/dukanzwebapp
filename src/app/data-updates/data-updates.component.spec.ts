import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';

import { ManagementHeaderComponent } from '../shared/management-header/management-header.component';
import { ManagementPanelComponent } from '../shared/management-panel/management-panel.component';
import { ConfirmDialogComponent } from '../shared/ui/confirm-dialog/confirm-dialog.component';
import { UiButtonComponent } from '../shared/ui/ui-button/ui-button.component';
import { UiSnackbarComponent } from '../shared/ui/ui-snackbar/ui-snackbar.component';
import { DataUpdatesService } from '../services/data-updates.service';
import { OrderService } from '../services/order.service';
import { AreaService } from '../services/area.service';
import { PurchaseService } from '../services/purchase.service';
import {
  DataUpdatesComponent,
  matchesOrderStatus,
  matchesPurchaseStatus,
  matchesArea,
  matchesDriverAssigned,
  matchesTotalRange,
  matchesCustomerPhone,
  matchesCustomerName,
  matchesOrderId,
  matchesPlacedDate,
  matchesPurchaseDate,
  matchesPurchaseStatusFilter,
  matchesPurchaseArea,
  matchesPurchaseTotalRange,
  matchesPurchaseItemRange,
  matchesPurchaseOrderRange,
  matchesPurchaseId
} from './data-updates.component';
import { Order } from '../models/order.model';
import { PurchaseSummary } from '../models/purchase.model';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-abc123',
    status: 'Approved',
    orderTotalPrice: 500,
    deliveryChargeApplied: 50,
    orderGrossPrice: 550,
    orderDeviceDttm: '2026-05-22T10:00:00',
    user: { id: 'u1', name: 'Ali Ahmed', address: '123 St', phoneNumber: '03001234567' },
    driver: null,
    areaId: 'area-1',
    createdAtPk: '2026-05-22T10:00:00',
    purchaseStatus: null,
    purchaseHistory: [],
    ...overrides
  };
}

function makePurchase(overrides: Partial<PurchaseSummary> = {}): PurchaseSummary {
  return {
    id: 'purch-abc123',
    purchDate: '2026-05-22T00:00:00',
    status: 'Purchased',
    total: 5000,
    itemCount: 10,
    orderCount: 5,
    areaId: 'area-1',
    ...overrides
  };
}

describe('DataUpdatesComponent', () => {
  let component: DataUpdatesComponent;
  let fixture: ComponentFixture<DataUpdatesComponent>;
  let dataUpdatesService: jasmine.SpyObj<DataUpdatesService>;
  let orderService: jasmine.SpyObj<OrderService>;
  let areaService: jasmine.SpyObj<AreaService>;
  let purchaseService: jasmine.SpyObj<PurchaseService>;

  beforeEach(async () => {
    dataUpdatesService = jasmine.createSpyObj<DataUpdatesService>('DataUpdatesService', ['resetPurchase', 'resetPacking']);
    dataUpdatesService.resetPurchase.and.returnValue(of({ scannedOrderCount: 10, updatedOrderCount: 4 }));
    dataUpdatesService.resetPacking.and.returnValue(of({ scannedOrderCount: 10, updatedOrderCount: 3 }));

    orderService = jasmine.createSpyObj<OrderService>('OrderService', ['getOrdersForDate']);
    orderService.getOrdersForDate.and.returnValue(of([]));

    areaService = jasmine.createSpyObj<AreaService>('AreaService', ['getAll']);
    areaService.getAll.and.returnValue(of([]));

    purchaseService = jasmine.createSpyObj<PurchaseService>('PurchaseService', ['listPurchases', 'deletePurchase']);
    purchaseService.listPurchases.and.returnValue(of([]));
    purchaseService.deletePurchase.and.returnValue(of(true));

    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [
        DataUpdatesComponent,
        ManagementHeaderComponent,
        ManagementPanelComponent,
        UiButtonComponent,
        ConfirmDialogComponent,
        UiSnackbarComponent
      ],
      providers: [
        { provide: DataUpdatesService, useValue: dataUpdatesService },
        { provide: OrderService, useValue: orderService },
        { provide: AreaService, useValue: areaService },
        { provide: PurchaseService, useValue: purchaseService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DataUpdatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the page header', () => {
    expect(fixture.nativeElement.textContent).toContain('Data Admin');
  });

  it('defaults to Orders tab', () => {
    expect(component.activeTab).toBe('orders');
  });

  it('switches to Purchases tab', () => {
    component.switchTab('purchases');
    expect(component.activeTab).toBe('purchases');
  });

  it('loads areas on init', () => {
    expect(areaService.getAll).toHaveBeenCalledTimes(1);
  });

  // ── Orders tab ────────────────────────────────────────

  it('shows validation error and does not call service when date is empty', () => {
    component.filterDate = '';
    component.onFindOrders();
    expect(component.filterDateRequired).toBeTrue();
    expect(orderService.getOrdersForDate).not.toHaveBeenCalled();
  });

  it('calls getOrdersForDate and applies filters when date is set', () => {
    const orders = [makeOrder()];
    orderService.getOrdersForDate.and.returnValue(of(orders));
    component.filterDate = '2026-05-22';
    component.onFindOrders();
    expect(orderService.getOrdersForDate).toHaveBeenCalledTimes(1);
    expect(component.filteredOrders).toEqual(orders);
  });

  it('shows error when getOrdersForDate fails', () => {
    orderService.getOrdersForDate.and.returnValue(throwError(() => new Error('network')));
    component.filterDate = '2026-05-22';
    component.onFindOrders();
    expect(component.filterError).toBeTruthy();
    expect(component.filteredOrders).toBeNull();
  });

  it('clears order results when filter input changes', () => {
    component.filteredOrders = [makeOrder()];
    component.onFilterInputChange();
    expect(component.filteredOrders).toBeNull();
  });

  it('Reset Purchase disabled when no order results', () => {
    component.filteredOrders = null;
    expect(component.hasResults).toBeFalse();
  });

  it('Reset Purchase enabled when order results present', () => {
    component.filteredOrders = [makeOrder()];
    expect(component.hasResults).toBeTrue();
  });

  it('passes filtered order IDs to resetPurchase', () => {
    component.filteredOrders = [makeOrder({ id: 'order-abc123' })];
    component.openResetConfirmation();
    component.confirmReset();
    expect(dataUpdatesService.resetPurchase).toHaveBeenCalledWith(['order-abc123']);
    expect(component.feedbackMessage).toContain('4 of 1 orders updated');
  });

  it('shows error when reset fails', () => {
    dataUpdatesService.resetPurchase.and.returnValue(throwError(() => new Error('fail')));
    component.filteredOrders = [makeOrder()];
    component.openResetConfirmation();
    component.confirmReset();
    expect(component.feedbackTone).toBe('error');
  });

  it('Reset Packing disabled when no order results', () => {
    component.filteredOrders = null;
    expect(component.hasResults).toBeFalse();
  });

  it('passes filtered order IDs to resetPacking', () => {
    component.filteredOrders = [makeOrder({ id: 'order-xyz' })];
    component.openResetPackingConfirmation();
    component.confirmResetPacking();
    expect(dataUpdatesService.resetPacking).toHaveBeenCalledWith(['order-xyz']);
    expect(component.feedbackMessage).toContain('3 of 1 orders updated');
  });

  it('shows error when resetPacking fails', () => {
    dataUpdatesService.resetPacking.and.returnValue(throwError(() => new Error('fail')));
    component.filteredOrders = [makeOrder()];
    component.openResetPackingConfirmation();
    component.confirmResetPacking();
    expect(component.feedbackTone).toBe('error');
    expect(component.feedbackMessage).toContain('Failed to reset packing');
  });

  it('openResetPackingConfirmation does nothing when no results', () => {
    component.filteredOrders = null;
    component.openResetPackingConfirmation();
    expect(component.showResetPackingConfirmation).toBeFalse();
  });

  // ── Purchases tab ─────────────────────────────────────

  it('calls listPurchases and applies filters on Find purchases', () => {
    const purchases = [makePurchase()];
    purchaseService.listPurchases.and.returnValue(of(purchases));
    component.onFindPurchases();
    expect(purchaseService.listPurchases).toHaveBeenCalledOnceWith(undefined);
    expect(component.filteredPurchases).toEqual(purchases);
  });

  it('passes pFilterDate as dateKey to listPurchases', () => {
    purchaseService.listPurchases.and.returnValue(of([]));
    component.pFilterDate = '2026-05-22';
    component.onFindPurchases();
    expect(purchaseService.listPurchases).toHaveBeenCalledOnceWith('2026-05-22');
  });

  it('shows error when listPurchases fails', () => {
    purchaseService.listPurchases.and.returnValue(throwError(() => new Error('fail')));
    component.onFindPurchases();
    expect(component.pFilterError).toBeTruthy();
    expect(component.filteredPurchases).toBeNull();
  });

  it('clears purchase results when purchase filter input changes', () => {
    component.filteredPurchases = [makePurchase()];
    component.onPurchaseFilterInputChange();
    expect(component.filteredPurchases).toBeNull();
  });

  it('Delete purchases disabled when no purchase results', () => {
    component.filteredPurchases = null;
    expect(component.hasPurchaseResults).toBeFalse();
  });

  it('Delete purchases enabled when purchase results present', () => {
    component.filteredPurchases = [makePurchase()];
    expect(component.hasPurchaseResults).toBeTrue();
  });

  it('openDeleteConfirmation does nothing when no results', () => {
    component.filteredPurchases = null;
    component.openDeleteConfirmation();
    expect(component.showDeleteConfirmation).toBeFalse();
  });

  it('calls deletePurchase for each filtered purchase and shows success', () => {
    const p1 = makePurchase({ id: 'p-1' });
    const p2 = makePurchase({ id: 'p-2' });
    component.filteredPurchases = [p1, p2];
    component.openDeleteConfirmation();
    component.confirmDelete();

    expect(purchaseService.deletePurchase).toHaveBeenCalledWith('p-1');
    expect(purchaseService.deletePurchase).toHaveBeenCalledWith('p-2');
    expect(component.feedbackTone).toBe('success');
    expect(component.feedbackMessage).toContain('2 of 2');
  });

  it('shows error when delete fails', () => {
    purchaseService.deletePurchase.and.returnValue(throwError(() => new Error('fail')));
    component.filteredPurchases = [makePurchase()];
    component.openDeleteConfirmation();
    component.confirmDelete();
    expect(component.feedbackTone).toBe('error');
  });

  it('cancelDelete closes dialog without calling service', () => {
    component.filteredPurchases = [makePurchase()];
    component.openDeleteConfirmation();
    component.cancelDelete();
    expect(component.showDeleteConfirmation).toBeFalse();
    expect(purchaseService.deletePurchase).not.toHaveBeenCalled();
  });

  it('keeps deleting flag true while pending', () => {
    const pending = new Subject<boolean>();
    purchaseService.deletePurchase.and.returnValue(pending.asObservable());
    component.filteredPurchases = [makePurchase()];
    component.openDeleteConfirmation();
    component.confirmDelete();
    expect(component.deleting).toBeTrue();
    pending.next(true);
    pending.complete();
    expect(component.deleting).toBeFalse();
  });
});

// ── Order filter function tests ──────────────────────────────────────────────

describe('matchesOrderStatus', () => {
  const order = makeOrder({ status: 'Approved' });
  it('returns true for "any"', () => expect(matchesOrderStatus(order, 'any')).toBeTrue());
  it('matches correct status', () => expect(matchesOrderStatus(order, 'Approved')).toBeTrue());
  it('rejects wrong status', () => expect(matchesOrderStatus(order, 'Packed')).toBeFalse());
  it('is case-insensitive', () => expect(matchesOrderStatus(order, 'approved')).toBeTrue());
});

describe('matchesPurchaseStatus', () => {
  const linked = makeOrder({ purchaseHistory: [{ purchaseId: 'p1', timestampPk: '2026-01-01' }], purchaseStatus: 'Purchased' });
  const unlinked = makeOrder({ purchaseHistory: [], purchaseStatus: null });
  it('returns true for "any"', () => expect(matchesPurchaseStatus(linked, 'any')).toBeTrue());
  it('linked filter matches order with history', () => expect(matchesPurchaseStatus(linked, 'linked')).toBeTrue());
  it('not-linked filter matches order without history', () => expect(matchesPurchaseStatus(unlinked, 'not-linked')).toBeTrue());
  it('status-set matches', () => expect(matchesPurchaseStatus(linked, 'status-set')).toBeTrue());
  it('status-unset matches', () => expect(matchesPurchaseStatus(unlinked, 'status-unset')).toBeTrue());
});

describe('matchesArea', () => {
  const order = makeOrder({ areaId: 'area-1' });
  it('returns true for "any"', () => expect(matchesArea(order, 'any')).toBeTrue());
  it('matches correct area', () => expect(matchesArea(order, 'area-1')).toBeTrue());
  it('rejects wrong area', () => expect(matchesArea(order, 'area-2')).toBeFalse());
});

describe('matchesDriverAssigned', () => {
  const withDriver = makeOrder({ driver: { id: 'd1', name: 'Driver', address: '', phoneNumber: '0300' } });
  const noDriver = makeOrder({ driver: null });
  it('assigned matches with driver', () => expect(matchesDriverAssigned(withDriver, 'assigned')).toBeTrue());
  it('unassigned matches without driver', () => expect(matchesDriverAssigned(noDriver, 'unassigned')).toBeTrue());
});

describe('matchesTotalRange', () => {
  const order = makeOrder({ orderGrossPrice: 500 });
  it('within range passes', () => expect(matchesTotalRange(order, 100, 1000)).toBeTrue());
  it('below min fails', () => expect(matchesTotalRange(order, 600, null)).toBeFalse());
  it('above max fails', () => expect(matchesTotalRange(order, null, 400)).toBeFalse());
});

describe('matchesCustomerPhone', () => {
  const order = makeOrder({ user: { id: 'u1', name: 'Ali', address: '', phoneNumber: '03001234567' } });
  it('empty query passes', () => expect(matchesCustomerPhone(order, '')).toBeTrue());
  it('partial match passes', () => expect(matchesCustomerPhone(order, '1234')).toBeTrue());
  it('non-matching fails', () => expect(matchesCustomerPhone(order, '9999')).toBeFalse());
});

describe('matchesCustomerName', () => {
  const order = makeOrder({ user: { id: 'u1', name: 'Ali Ahmed', address: '', phoneNumber: '' } });
  it('case-insensitive partial match', () => expect(matchesCustomerName(order, 'ali')).toBeTrue());
  it('non-matching fails', () => expect(matchesCustomerName(order, 'zara')).toBeFalse());
});

describe('matchesOrderId', () => {
  const order = makeOrder({ id: 'order-abc123' });
  it('partial match passes', () => expect(matchesOrderId(order, 'abc')).toBeTrue());
  it('non-matching fails', () => expect(matchesOrderId(order, 'xyz')).toBeFalse());
});

describe('matchesPlacedDate', () => {
  it('empty date passes', () => expect(matchesPlacedDate(makeOrder(), '')).toBeTrue());
  it('matches createdAtPk date', () => expect(matchesPlacedDate(makeOrder({ createdAtPk: '2026-05-22T10:00:00' }), '2026-05-22')).toBeTrue());
  it('falls back to orderDeviceDttm', () => expect(matchesPlacedDate(makeOrder({ createdAtPk: null, orderDeviceDttm: '2026-05-22T10:00:00' }), '2026-05-22')).toBeTrue());
  it('wrong date fails', () => expect(matchesPlacedDate(makeOrder({ createdAtPk: '2026-05-22T10:00:00' }), '2026-05-23')).toBeFalse());
});

// ── Purchase filter function tests ───────────────────────────────────────────

describe('matchesPurchaseDate', () => {
  const p = makePurchase({ purchDate: '2026-05-22T00:00:00' });
  it('empty date passes', () => expect(matchesPurchaseDate(p, '')).toBeTrue());
  it('matching date passes', () => expect(matchesPurchaseDate(p, '2026-05-22')).toBeTrue());
  it('wrong date fails', () => expect(matchesPurchaseDate(p, '2026-05-23')).toBeFalse());
});

describe('matchesPurchaseStatusFilter', () => {
  const p = makePurchase({ status: 'Purchased' });
  it('"any" passes', () => expect(matchesPurchaseStatusFilter(p, 'any')).toBeTrue());
  it('matching status passes', () => expect(matchesPurchaseStatusFilter(p, 'Purchased')).toBeTrue());
  it('wrong status fails', () => expect(matchesPurchaseStatusFilter(p, 'Partial')).toBeFalse());
  it('case-insensitive', () => expect(matchesPurchaseStatusFilter(p, 'purchased')).toBeTrue());
});

describe('matchesPurchaseArea', () => {
  const p = makePurchase({ areaId: 'area-1' });
  it('"any" passes', () => expect(matchesPurchaseArea(p, 'any')).toBeTrue());
  it('matching area passes', () => expect(matchesPurchaseArea(p, 'area-1')).toBeTrue());
  it('wrong area fails', () => expect(matchesPurchaseArea(p, 'area-2')).toBeFalse());
});

describe('matchesPurchaseTotalRange', () => {
  const p = makePurchase({ total: 5000 });
  it('within range passes', () => expect(matchesPurchaseTotalRange(p, 1000, 10000)).toBeTrue());
  it('below min fails', () => expect(matchesPurchaseTotalRange(p, 6000, null)).toBeFalse());
  it('above max fails', () => expect(matchesPurchaseTotalRange(p, null, 4000)).toBeFalse());
});

describe('matchesPurchaseItemRange', () => {
  const p = makePurchase({ itemCount: 10 });
  it('within range passes', () => expect(matchesPurchaseItemRange(p, 5, 20)).toBeTrue());
  it('below min fails', () => expect(matchesPurchaseItemRange(p, 15, null)).toBeFalse());
  it('above max fails', () => expect(matchesPurchaseItemRange(p, null, 5)).toBeFalse());
});

describe('matchesPurchaseOrderRange', () => {
  const p = makePurchase({ orderCount: 5 });
  it('within range passes', () => expect(matchesPurchaseOrderRange(p, 1, 10)).toBeTrue());
  it('below min fails', () => expect(matchesPurchaseOrderRange(p, 8, null)).toBeFalse());
  it('above max fails', () => expect(matchesPurchaseOrderRange(p, null, 3)).toBeFalse());
});

describe('matchesPurchaseId', () => {
  const p = makePurchase({ id: 'purch-abc123' });
  it('empty query passes', () => expect(matchesPurchaseId(p, '')).toBeTrue());
  it('partial match passes', () => expect(matchesPurchaseId(p, 'abc')).toBeTrue());
  it('non-matching fails', () => expect(matchesPurchaseId(p, 'xyz')).toBeFalse());
});
