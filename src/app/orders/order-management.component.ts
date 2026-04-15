import { Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

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
  historyStartDate: string = this.todayIso();
  historyEndDate: string = this.todayIso();
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
    this.normalizeHistoryRange();

    const requests = this.getHistoryDatesInRange().map((date) =>
      this.orderService.getOrdersForDate(date)
    );

    forkJoin(requests).subscribe({
      next: (dailyOrders) => {
        this.loading = false;
        const seen = new Set<string>();
        this.historyOrders = dailyOrders
          .flat()
          .filter((order) => {
            if (seen.has(order.id)) return false;
            seen.add(order.id);
            return true;
          })
          .sort(
            (a, b) =>
              new Date(b.orderDeviceDttm).getTime() -
              new Date(a.orderDeviceDttm).getTime()
          );
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
      case 'Approved':
      case 'Processing':
      case 'Dispatched':
        return 'success';
      default:
        return 'muted';
    }
  }

  private todayIso(): string {
    return new Date().toISOString().split('T')[0];
  }

  private normalizeHistoryRange(): void {
    if (!this.historyStartDate && !this.historyEndDate) {
      const today = this.todayIso();
      this.historyStartDate = today;
      this.historyEndDate = today;
      return;
    }

    if (!this.historyStartDate) {
      this.historyStartDate = this.historyEndDate || this.todayIso();
    }

    if (!this.historyEndDate) {
      this.historyEndDate = this.historyStartDate;
    }

    if (this.historyStartDate > this.historyEndDate) {
      [this.historyStartDate, this.historyEndDate] = [
        this.historyEndDate,
        this.historyStartDate
      ];
    }
  }

  private getHistoryDatesInRange(): Date[] {
    const start = new Date(`${this.historyStartDate}T00:00:00`);
    const end = new Date(`${this.historyEndDate}T00:00:00`);
    const dates: Date[] = [];
    const cursor = new Date(start);

    while (cursor.getTime() <= end.getTime()) {
      dates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    return dates;
  }
}
