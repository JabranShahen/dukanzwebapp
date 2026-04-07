import { Component, OnInit } from '@angular/core';

import { Order, ACTIVE_ORDER_STATUSES } from '../../models/order.model';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-dashboard-overview',
  templateUrl: './dashboard-overview.component.html',
  styleUrls: ['./dashboard-overview.component.scss']
})
export class DashboardOverviewComponent implements OnInit {
  loading = true;
  error = '';
  outstandingOrders: Order[] = [];
  selectedOrder: Order | null = null;

  constructor(private readonly orderService: OrderService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.orderService.getOutstandingOrders().subscribe({
      next: (orders) => {
        this.outstandingOrders = orders;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load orders.';
        this.loading = false;
      }
    });
  }

  get ordersToday(): Order[] {
    const todayStr = new Date().toDateString();
    return this.outstandingOrders.filter(
      (o) => new Date(o.orderDeviceDttm).toDateString() === todayStr
    );
  }

  get pendingOrders(): Order[] {
    return this.outstandingOrders.filter((o) =>
      ACTIVE_ORDER_STATUSES.includes(o.status as any)
    );
  }

  get lateOrders(): Order[] {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return this.outstandingOrders.filter(
      (o) =>
        ACTIVE_ORDER_STATUSES.includes(o.status as any) &&
        new Date(o.orderDeviceDttm).getTime() < cutoff
    );
  }

  get activeCustomerCount(): number {
    const ids = new Set(
      this.outstandingOrders.map((o) => o.user?.id).filter(Boolean)
    );
    return ids.size;
  }

  get recentOrders(): Order[] {
    return [...this.outstandingOrders]
      .sort(
        (a, b) =>
          new Date(b.orderDeviceDttm).getTime() -
          new Date(a.orderDeviceDttm).getTime()
      )
      .slice(0, 15);
  }

  formatAge(dttm: string): string {
    const diffMs = Date.now() - new Date(dttm).getTime();
    const diffH = Math.floor(diffMs / 3_600_000);
    const diffM = Math.floor(diffMs / 60_000);
    if (diffH >= 48) return `${Math.floor(diffH / 24)}d ago`;
    if (diffH >= 1) return `${diffH}h ago`;
    if (diffM >= 1) return `${diffM}m ago`;
    return 'just now';
  }

  statusTone(status: string): string {
    switch (status) {
      case 'Sending':
      case 'Approved':
        return 'pending';
      case 'Processing':
        return 'info';
      case 'Dispatched':
        return 'warning';
      case 'Canceling':
        return 'danger';
      case 'Delivered':
        return 'success';
      default:
        return 'muted';
    }
  }

  openOrder(order: Order): void {
    this.selectedOrder = order;
  }

  closeOrder(): void {
    this.selectedOrder = null;
  }

  trackById(_: number, order: Order): string {
    return order.id;
  }
}
