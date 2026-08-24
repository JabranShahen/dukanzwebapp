import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import { Area } from '../models/area.model';
import { Order } from '../models/order.model';
import { PurchaseSummary } from '../models/purchase.model';
import { DataUpdatesService } from '../services/data-updates.service';
import { OrderService } from '../services/order.service';
import { AreaService } from '../services/area.service';
import { PurchaseService } from '../services/purchase.service';

@Component({
  selector: 'app-data-updates',
  templateUrl: './data-updates.component.html',
  styleUrls: ['./data-updates.component.scss']
})
export class DataUpdatesComponent implements OnInit {
  activeTab: 'orders' | 'purchases' = 'orders';

  // ── Shared ────────────────────────────────────────────
  feedbackMessage = '';
  feedbackTone: 'success' | 'error' = 'success';
  areas: Area[] = [];

  // ── Orders tab state ──────────────────────────────────
  showResetConfirmation = false;
  resetting = false;

  showResetPackingConfirmation = false;
  resettingPacking = false;

  filterDate = '';
  filterOrderStatus = 'any';
  filterPurchaseStatus = 'any';
  filterAreaId = 'any';
  filterDriverAssigned = 'any';
  filterMinTotal: number | null = null;
  filterMaxTotal: number | null = null;
  filterCustomerPhone = '';
  filterCustomerName = '';
  filterOrderId = '';
  filterPlacedDate = '';

  filteredOrders: Order[] | null = null;
  filterLoading = false;
  filterError = '';
  filterDateRequired = false;

  // ── Purchases tab state ───────────────────────────────
  showDeleteConfirmation = false;
  deleting = false;

  pFilterDate = '';
  pFilterStatus = 'any';
  pFilterAreaId = 'any';
  pFilterMinTotal: number | null = null;
  pFilterMaxTotal: number | null = null;
  pFilterMinItems: number | null = null;
  pFilterMaxItems: number | null = null;
  pFilterMinOrders: number | null = null;
  pFilterMaxOrders: number | null = null;
  pFilterId = '';

  filteredPurchases: PurchaseSummary[] | null = null;
  pFilterLoading = false;
  pFilterError = '';

  constructor(
    private readonly dataUpdatesService: DataUpdatesService,
    private readonly orderService: OrderService,
    private readonly areaService: AreaService,
    private readonly purchaseService: PurchaseService
  ) {}

  ngOnInit(): void {
    this.areaService.getAll().subscribe({
      next: (areas) => { this.areas = areas; }
    });
  }

  switchTab(tab: 'orders' | 'purchases'): void {
    this.activeTab = tab;
  }

  onFeedbackDismissed(): void {
    this.feedbackMessage = '';
  }

  // ── Orders tab ────────────────────────────────────────

  onFilterInputChange(): void {
    this.filteredOrders = null;
    this.filterError = '';
    this.filterDateRequired = false;
  }

  onFindOrders(): void {
    if (!this.filterDate) {
      this.filterDateRequired = true;
      return;
    }

    this.filterDateRequired = false;
    this.filterLoading = true;
    this.filterError = '';
    this.filteredOrders = null;

    const [year, month, day] = this.filterDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    this.orderService.getOrdersForDate(date).subscribe({
      next: (orders) => {
        this.filterLoading = false;
        this.filteredOrders = orders.filter(o => this.applyOrderFilters(o));
      },
      error: () => {
        this.filterLoading = false;
        this.filterError = 'Failed to load orders. Check your connection and try again.';
      }
    });
  }

  private applyOrderFilters(order: Order): boolean {
    return matchesOrderStatus(order, this.filterOrderStatus)
      && matchesPurchaseStatus(order, this.filterPurchaseStatus)
      && matchesArea(order, this.filterAreaId)
      && matchesDriverAssigned(order, this.filterDriverAssigned)
      && matchesTotalRange(order, this.filterMinTotal, this.filterMaxTotal)
      && matchesCustomerPhone(order, this.filterCustomerPhone)
      && matchesCustomerName(order, this.filterCustomerName)
      && matchesOrderId(order, this.filterOrderId)
      && matchesPlacedDate(order, this.filterPlacedDate);
  }

  get hasResults(): boolean {
    return this.filteredOrders !== null && this.filteredOrders.length > 0;
  }

  openResetConfirmation(): void {
    if (this.resetting || !this.hasResults) return;
    this.showResetConfirmation = true;
  }

  cancelReset(): void {
    if (this.resetting) return;
    this.showResetConfirmation = false;
  }

  confirmReset(): void {
    if (this.resetting || !this.filteredOrders) return;

    const orderIds = this.filteredOrders.map(o => o.id);
    const sentCount = orderIds.length;
    this.resetting = true;

    this.dataUpdatesService.resetPurchase(orderIds).subscribe({
      next: (result) => {
        this.resetting = false;
        this.showResetConfirmation = false;
        this.feedbackTone = 'success';
        this.feedbackMessage = `Purchase reset complete. ${result.updatedOrderCount} of ${sentCount} orders updated.`;
        this.onFindOrders();
      },
      error: () => {
        this.resetting = false;
        this.showResetConfirmation = false;
        this.feedbackTone = 'error';
        this.feedbackMessage = 'Failed to reset purchase data.';
      }
    });
  }

  openResetPackingConfirmation(): void {
    if (this.resettingPacking || !this.hasResults) return;
    this.showResetPackingConfirmation = true;
  }

  cancelResetPacking(): void {
    if (this.resettingPacking) return;
    this.showResetPackingConfirmation = false;
  }

  confirmResetPacking(): void {
    if (this.resettingPacking || !this.filteredOrders) return;

    const orderIds = this.filteredOrders.map(o => o.id);
    const sentCount = orderIds.length;
    this.resettingPacking = true;

    this.dataUpdatesService.resetPacking(orderIds).subscribe({
      next: (result) => {
        this.resettingPacking = false;
        this.showResetPackingConfirmation = false;
        this.feedbackTone = 'success';
        this.feedbackMessage = `Packing reset complete. ${result.updatedOrderCount} of ${sentCount} orders updated.`;
        this.onFindOrders();
      },
      error: () => {
        this.resettingPacking = false;
        this.showResetPackingConfirmation = false;
        this.feedbackTone = 'error';
        this.feedbackMessage = 'Failed to reset packing data.';
      }
    });
  }

  truncateId(id: string): string {
    return id.length > 8 ? id.slice(0, 8) : id;
  }

  placedDateDisplay(order: Order): string {
    const raw = order.createdAtPk ?? order.orderDeviceDttm;
    if (!raw) return '';
    return raw.slice(0, 10);
  }

  purchaseStatusDisplay(order: Order): string {
    if (order.purchaseStatus) return order.purchaseStatus;
    if (order.purchaseHistory && order.purchaseHistory.length > 0) return 'Linked';
    return 'Not linked';
  }

  // ── Purchases tab ─────────────────────────────────────

  onPurchaseFilterInputChange(): void {
    this.filteredPurchases = null;
    this.pFilterError = '';
  }

  onFindPurchases(): void {
    this.pFilterLoading = true;
    this.pFilterError = '';
    this.filteredPurchases = null;

    this.purchaseService.listPurchases(this.pFilterDate || undefined).subscribe({
      next: (purchases) => {
        this.pFilterLoading = false;
        this.filteredPurchases = purchases.filter(p => this.applyPurchaseFilters(p));
      },
      error: () => {
        this.pFilterLoading = false;
        this.pFilterError = 'Failed to load purchases. Check your connection and try again.';
      }
    });
  }

  private applyPurchaseFilters(p: PurchaseSummary): boolean {
    return matchesPurchaseStatusFilter(p, this.pFilterStatus)
      && matchesPurchaseArea(p, this.pFilterAreaId)
      && matchesPurchaseTotalRange(p, this.pFilterMinTotal, this.pFilterMaxTotal)
      && matchesPurchaseItemRange(p, this.pFilterMinItems, this.pFilterMaxItems)
      && matchesPurchaseOrderRange(p, this.pFilterMinOrders, this.pFilterMaxOrders)
      && matchesPurchaseId(p, this.pFilterId);
  }

  get hasPurchaseResults(): boolean {
    return this.filteredPurchases !== null && this.filteredPurchases.length > 0;
  }

  openDeleteConfirmation(): void {
    if (this.deleting || !this.hasPurchaseResults) return;
    this.showDeleteConfirmation = true;
  }

  cancelDelete(): void {
    if (this.deleting) return;
    this.showDeleteConfirmation = false;
  }

  confirmDelete(): void {
    if (this.deleting || !this.filteredPurchases) return;

    const toDelete = [...this.filteredPurchases];
    const totalCount = toDelete.length;
    this.deleting = true;

    const deletes = toDelete.map(p => this.purchaseService.deletePurchase(p.id));

    forkJoin(deletes).subscribe({
      next: (results) => {
        this.deleting = false;
        this.showDeleteConfirmation = false;
        const deleted = results.filter(r => r === true).length;
        this.feedbackTone = 'success';
        this.feedbackMessage = `Deleted ${deleted} of ${totalCount} purchases.`;
        this.onFindPurchases();
      },
      error: () => {
        this.deleting = false;
        this.showDeleteConfirmation = false;
        this.feedbackTone = 'error';
        this.feedbackMessage = 'Failed to delete purchases.';
      }
    });
  }
}

// ── Order filter functions ─────────────────────────────────────────────────

export function matchesOrderStatus(order: Order, status: string): boolean {
  if (!status || status === 'any') return true;
  return (order.status ?? '').toLowerCase() === status.toLowerCase();
}

export function matchesPurchaseStatus(order: Order, filter: string): boolean {
  if (!filter || filter === 'any') return true;
  const hasHistory = (order.purchaseHistory?.length ?? 0) > 0;
  const hasPurchaseStatus = !!(order.purchaseStatus);
  switch (filter) {
    case 'linked':       return hasHistory;
    case 'not-linked':   return !hasHistory;
    case 'status-set':   return hasPurchaseStatus;
    case 'status-unset': return !hasPurchaseStatus;
    default:             return true;
  }
}

export function matchesArea(order: Order, areaId: string): boolean {
  if (!areaId || areaId === 'any') return true;
  return (order.areaId ?? '') === areaId;
}

export function matchesDriverAssigned(order: Order, filter: string): boolean {
  if (!filter || filter === 'any') return true;
  const assigned = order.driver != null;
  return filter === 'assigned' ? assigned : !assigned;
}

export function matchesTotalRange(order: Order, min: number | null, max: number | null): boolean {
  const total = order.orderGrossPrice ?? 0;
  if (min !== null && total < min) return false;
  if (max !== null && total > max) return false;
  return true;
}

export function matchesCustomerPhone(order: Order, query: string): boolean {
  if (!query || !query.trim()) return true;
  return (order.user?.phoneNumber ?? '').toLowerCase().includes(query.trim().toLowerCase());
}

export function matchesCustomerName(order: Order, query: string): boolean {
  if (!query || !query.trim()) return true;
  return (order.user?.name ?? '').toLowerCase().includes(query.trim().toLowerCase());
}

export function matchesOrderId(order: Order, query: string): boolean {
  if (!query || !query.trim()) return true;
  return (order.id ?? '').toLowerCase().includes(query.trim().toLowerCase());
}

export function matchesPlacedDate(order: Order, dateStr: string): boolean {
  if (!dateStr) return true;
  const raw = order.createdAtPk ?? order.orderDeviceDttm;
  if (!raw) return false;
  return raw.slice(0, 10) === dateStr;
}

// ── Purchase filter functions ──────────────────────────────────────────────

export function matchesPurchaseDate(p: PurchaseSummary, dateStr: string): boolean {
  if (!dateStr) return true;
  return (p.purchDate ?? '').slice(0, 10) === dateStr;
}

export function matchesPurchaseStatusFilter(p: PurchaseSummary, status: string): boolean {
  if (!status || status === 'any') return true;
  return (p.status ?? '').toLowerCase() === status.toLowerCase();
}

export function matchesPurchaseArea(p: PurchaseSummary, areaId: string): boolean {
  if (!areaId || areaId === 'any') return true;
  return (p.areaId ?? '') === areaId;
}

export function matchesPurchaseTotalRange(p: PurchaseSummary, min: number | null, max: number | null): boolean {
  const total = p.total ?? 0;
  if (min !== null && total < min) return false;
  if (max !== null && total > max) return false;
  return true;
}

export function matchesPurchaseItemRange(p: PurchaseSummary, min: number | null, max: number | null): boolean {
  const count = p.itemCount ?? 0;
  if (min !== null && count < min) return false;
  if (max !== null && count > max) return false;
  return true;
}

export function matchesPurchaseOrderRange(p: PurchaseSummary, min: number | null, max: number | null): boolean {
  const count = p.orderCount ?? 0;
  if (min !== null && count < min) return false;
  if (max !== null && count > max) return false;
  return true;
}

export function matchesPurchaseId(p: PurchaseSummary, query: string): boolean {
  if (!query || !query.trim()) return true;
  return (p.id ?? '').toLowerCase().includes(query.trim().toLowerCase());
}
