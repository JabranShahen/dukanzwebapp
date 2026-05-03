import { Component, OnInit } from '@angular/core';

import { Order, normalizeOrderStatus, OrderStatusEntry } from '../models/order.model';
import { PackingBatchDetail, PackingOrderSummary } from '../models/packing.model';
import { OrderService } from '../services/order.service';
import { PackingService } from '../services/packing.service';

const DELIVERY_OFFSET_DAYS = 1;

@Component({
  selector: 'app-operational-day-dashboard',
  templateUrl: './operational-day-dashboard.component.html',
  styleUrls: ['./operational-day-dashboard.component.scss']
})
export class OperationalDayDashboardComponent implements OnInit {

  // ── State ──────────────────────────────────────────────────────────────────
  selectedDate: string = this.todayIso();
  loadingOrders = false;
  loadingPacking = false;
  ordersError = '';
  packingError = '';
  orders: Order[] = [];
  packingDetail: PackingBatchDetail | null = null;
  packingNotFound = false;
  expandedOrderId: string | null = null;

  constructor(
    private readonly orderService: OrderService,
    private readonly packingService: PackingService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  // ── Data loading ───────────────────────────────────────────────────────────
  load(): void {
    this.loadOrders();
    this.loadPacking();
  }

  onDateChange(): void {
    this.load();
  }

  private loadOrders(): void {
    this.loadingOrders = true;
    this.ordersError = '';
    const deliveryDate = new Date(`${this.selectedDate}T00:00:00`);
    this.orderService.getOrdersForDeliveryDate(deliveryDate).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loadingOrders = false;
      },
      error: () => {
        this.ordersError = 'Failed to load orders for this date.';
        this.loadingOrders = false;
      }
    });
  }

  private loadPacking(): void {
    this.loadingPacking = true;
    this.packingError = '';
    this.packingNotFound = false;
    this.packingDetail = null;
    this.packingService.getBatch(this.purchaseDateKey).subscribe({
      next: (detail) => {
        this.packingDetail = detail;
        this.loadingPacking = false;
      },
      error: (err) => {
        if (err?.status === 404) {
          this.packingNotFound = true;
        } else {
          this.packingError = 'Failed to load packing data.';
        }
        this.loadingPacking = false;
      }
    });
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  get purchaseDateKey(): string {
    const d = new Date(`${this.selectedDate}T00:00:00`);
    d.setDate(d.getDate() - DELIVERY_OFFSET_DAYS);
    return d.toISOString().split('T')[0];
  }

  get isLoading(): boolean {
    return this.loadingOrders || this.loadingPacking;
  }

  get selectedDateLabel(): string {
    return new Date(`${this.selectedDate}T00:00:00`).toLocaleDateString([], {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    });
  }

  // ── Computed getters ───────────────────────────────────────────────────────
  get receivedCount(): number {
    return this.orders.length;
  }

  get packedCount(): number {
    return this.orders.filter(o => normalizeOrderStatus(o.status) === 'Packed').length;
  }

  get dispatchedCount(): number {
    return this.orders.filter(o => normalizeOrderStatus(o.status) === 'Dispatched').length;
  }

  get deliveredCount(): number {
    return this.orders.filter(o => normalizeOrderStatus(o.status) === 'Delivered').length;
  }

  get inFlightCount(): number {
    const inFlight = new Set(['Approved', 'Packed', 'Dispatched']);
    return this.orders.filter(o => inFlight.has(normalizeOrderStatus(o.status) as string)).length;
  }

  get totalGrossValue(): number {
    return this.orders.reduce((sum, o) => sum + (o.orderGrossPrice ?? 0), 0);
  }

  get deliveredGrossValue(): number {
    return this.orders
      .filter(o => normalizeOrderStatus(o.status) === 'Delivered')
      .reduce((sum, o) => sum + (o.orderGrossPrice ?? 0), 0);
  }

  get blockerOrders(): PackingOrderSummary[] {
    return this.packingDetail?.orders?.filter(o => o.packingState === 'Blocked') ?? [];
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  toggleOrder(orderId: string): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  sortedHistory(order: Order): OrderStatusEntry[] {
    return [...(order.statusHistory ?? [])].sort(
      (a, b) => new Date(a.timestampPk).getTime() - new Date(b.timestampPk).getTime()
    );
  }

  formatMoney(value: number): string {
    return `Rs ${Math.round(value || 0).toLocaleString()}`;
  }

  formatDateTime(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleString([], {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  shortId(id: string): string {
    return '…' + (id || '').slice(-6).toUpperCase();
  }

  statusTone(status: string): string {
    switch ((status ?? '').toLowerCase()) {
      case 'delivered':
      case 'purchased':
      case 'ready':
        return 'success';
      case 'packed':
      case 'dispatched':
      case 'partial':
        return 'warning';
      case 'declined':
      case 'cancelled':
      case 'blocked':
      case 'out of stock':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  private todayIso(): string {
    return new Date().toISOString().split('T')[0];
  }
}
