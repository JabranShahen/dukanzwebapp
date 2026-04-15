import { Component, OnDestroy, OnInit } from '@angular/core';

import {
  Order,
  OrderStatusAction,
  STATUS_ACTIONS
} from '../models/order.model';
import { OrderService } from '../services/order.service';

@Component({
  selector: 'app-driver-orders',
  templateUrl: './driver-orders.component.html',
  styleUrls: ['./driver-orders.component.scss']
})
export class DriverOrdersComponent implements OnInit, OnDestroy {
  loading = false;
  error = '';
  feedbackMessage = '';
  feedbackTone: 'success' | 'error' = 'success';
  showDone = false;

  activeOrders: Order[] = [];
  doneOrders: Order[] = [];

  updatingOrderIds = new Set<string>();

  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly orderService: OrderService) {}

  ngOnInit(): void {
    this.load();
    this.refreshTimer = setInterval(() => this.load(true), 30_000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer !== null) {
      clearInterval(this.refreshTimer);
    }
  }

  load(silent = false): void {
    if (!silent) {
      this.loading = true;
      this.error = '';
    }

    this.orderService.getOutstandingOrders().subscribe({
      next: (orders) => {
        this.loading = false;
        this.activeOrders = [...orders].sort(
          (a, b) =>
            new Date(a.orderDeviceDttm).getTime() - new Date(b.orderDeviceDttm).getTime()
        );
        this.doneOrders = [];
      },
      error: () => {
        this.loading = false;
        if (!silent) {
          this.error = 'Failed to load orders.';
        }
      }
    });
  }

  getActions(order: Order): OrderStatusAction[] {
    return STATUS_ACTIONS[order.status] ?? [];
  }

  applyAction(order: Order, action: OrderStatusAction): void {
    if (this.updatingOrderIds.has(order.id)) {
      return;
    }

    this.updatingOrderIds.add(order.id);

    this.orderService.updateStatus(order, action.nextStatus).subscribe({
      next: () => {
        this.updatingOrderIds.delete(order.id);
        this.feedbackTone = 'success';
        this.feedbackMessage = `Order ${this.shortId(order.id)} → ${action.nextStatus}`;
        this.load(true);
      },
      error: () => {
        this.updatingOrderIds.delete(order.id);
        this.feedbackTone = 'error';
        this.feedbackMessage = `Failed to update order ${this.shortId(order.id)}.`;
      }
    });
  }

  isUpdating(order: Order): boolean {
    return this.updatingOrderIds.has(order.id);
  }

  shortId(id: string): string {
    return ('ORD#' + (id || '').slice(-5)).toUpperCase();
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }

  onFeedbackDismissed(): void {
    this.feedbackMessage = '';
  }


  statusIcon(status: string): string {
    switch (status) {
      case 'Approved':  return 'assets/approved.png';
      case 'Processing': return 'assets/processing.png';
      case 'Dispatched': return 'assets/dispatched.png';
      case 'Delivered':  return 'assets/delivered.png';
      case 'Declined':   return 'assets/declined.png';
      case 'Cancelled':  return 'assets/cancelled.png';
      default:           return '';
    }
  }

  statusTone(status: string): string {
    switch (status) {
      case 'Approved': return 'pending';
      case 'Processing': return 'info';
      case 'Dispatched': return 'warning';
      case 'Delivered': return 'success';
      case 'Declined':
      case 'Cancelled': return 'muted';
      default: return 'muted';
    }
  }
}
