import { Component, OnDestroy, OnInit } from '@angular/core';

import { Order } from '../models/order.model';
import { OrderService } from '../services/order.service';

@Component({
  selector: 'app-order-management',
  templateUrl: './order-management.component.html',
  styleUrls: ['./order-management.component.scss']
})
export class OrderManagementComponent implements OnInit, OnDestroy {
  activeTab: 'live' | 'history' = 'live';
  liveOrders: Order[] = [];
  historyOrders: Order[] = [];
  selectedOrder: Order | null = null;
  selectedDate: string = this.todayIso();
  loading = false;
  error = '';

  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly orderService: OrderService) {}

  ngOnInit(): void {
    this.loadLive();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  loadLive(silent = false): void {
    if (!silent) {
      this.loading = true;
      this.error = '';
    }

    this.orderService.getOutstandingOrders().subscribe({
      next: (orders) => {
        this.loading = false;
        this.liveOrders = orders;
        if (this.selectedOrder) {
          const updated = orders.find(o => o.id === this.selectedOrder!.id);
          if (updated) {
            this.selectedOrder = { ...updated };
          }
        }
      },
      error: () => {
        this.loading = false;
        if (!silent) {
          this.error = 'Failed to load orders.';
        }
      }
    });
  }

  loadHistory(): void {
    this.loading = true;
    this.error = '';
    const date = new Date(this.selectedDate);
    this.orderService.getOrdersForDate(date).subscribe({
      next: (orders) => {
        this.loading = false;
        this.historyOrders = orders;
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load orders.';
      }
    });
  }

  switchTab(tab: 'live' | 'history'): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.selectedOrder = null;
    if (tab === 'live') {
      this.loadLive();
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
      this.loadHistory();
    }
  }

  openPanel(order: Order): void {
    this.selectedOrder = order;
  }

  closePanel(): void {
    this.selectedOrder = null;
  }

  onOrderUpdated(): void {
    if (this.activeTab === 'live') {
      this.loadLive(true);
    } else {
      this.loadHistory();
    }
  }

  onDateChange(): void {
    this.loadHistory();
  }

  startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.refreshTimer = setInterval(() => this.loadLive(true), 30_000);
  }

  stopAutoRefresh(): void {
    if (this.refreshTimer !== null) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  shortId(id: string): string {
    return '\u2026' + (id || '').slice(-8);
  }

  ageLabel(dateStr: string): string {
    if (!dateStr) return '—';
    const ms = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(ms / 60_000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ${mins % 60}m`;
    return `${Math.floor(hours / 24)}d`;
  }

  formatPrice(value: number): string {
    return 'Rs\u00a0' + (value || 0).toLocaleString();
  }

  statusTone(status: string): 'success' | 'muted' {
    switch (status) {
      case 'Sending':
      case 'Approved':
      case 'Processing':
      case 'Dispatched':
      case 'Canceling':
        return 'success';
      default:
        return 'muted';
    }
  }

  private todayIso(): string {
    return new Date().toISOString().split('T')[0];
  }
}
