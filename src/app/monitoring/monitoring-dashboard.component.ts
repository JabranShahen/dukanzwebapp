import { Component, OnInit } from '@angular/core';

import { normalizeOrderStatus, Order } from '../models/order.model';
import { OrderService } from '../services/order.service';

interface MonitoringMetric {
  label: string;
  value: string;
  hint: string;
  tone: 'neutral' | 'success' | 'warning' | 'accent';
}

interface MonitoringStage {
  label: string;
  value: number;
  hint: string;
  tone: 'neutral' | 'success' | 'warning' | 'accent';
}

@Component({
  selector: 'app-monitoring-dashboard',
  templateUrl: './monitoring-dashboard.component.html',
  styleUrls: ['./monitoring-dashboard.component.scss']
})
export class MonitoringDashboardComponent implements OnInit {
  selectedDate = this.todayIso();
  loading = true;
  error = '';

  orders: Order[] = [];
  stageMetrics: MonitoringStage[] = [];
  summaryMetrics: MonitoringMetric[] = [];

  constructor(private readonly orderService: OrderService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';

    this.orderService.getOrdersForDate(new Date(`${this.selectedDate}T00:00:00`)).subscribe({
      next: (orders) => {
        this.loading = false;
        this.orders = orders;
        this.rebuildDashboard();
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load monitoring data for the selected date.';
        this.orders = [];
        this.rebuildDashboard();
      }
    });
  }

  onDateChange(): void {
    this.load();
  }

  get totalOrders(): number {
    return this.orders.length;
  }

  get selectedDateLabel(): string {
    return this.formatDate(this.selectedDate);
  }

  get summaryHeadline(): string {
    if (this.totalOrders === 0) {
      return 'No order activity was recorded for this date.';
    }

    const delivered = this.countByStatus('Delivered');
    const bookedSales = this.totalGrossSales;
    return `${this.totalOrders} orders generated ${this.formatMoney(bookedSales)} in gross demand, with ${delivered} delivered.`;
  }

  get totalGrossSales(): number {
    return this.orders.reduce((sum, order) => sum + (order.orderGrossPrice || 0), 0);
  }

  get deliveredSales(): number {
    return this.orders
      .filter((order) => normalizeOrderStatus(order.status) === 'Delivered')
      .reduce((sum, order) => sum + (order.orderGrossPrice || 0), 0);
  }

  get averageOrderValue(): number {
    return this.totalOrders === 0 ? 0 : this.totalGrossSales / this.totalOrders;
  }

  get averageItemsPerOrder(): number {
    if (this.totalOrders === 0) {
      return 0;
    }

    const totalItems = this.orders.reduce((sum, order) => {
      const itemCount = order.orderItems?.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0) ?? 0;
      return sum + itemCount;
    }, 0);

    return totalItems / this.totalOrders;
  }

  get deliveryChargeAverage(): number {
    return this.totalOrders === 0
      ? 0
      : this.orders.reduce((sum, order) => sum + (order.deliveryChargeApplied || 0), 0) / this.totalOrders;
  }

  get conversionRate(): number {
    return this.totalOrders === 0 ? 0 : (this.countByStatus('Delivered') / this.totalOrders) * 100;
  }

  get inFlightOrders(): number {
    return this.orders.filter((order) => {
      const status = normalizeOrderStatus(order.status);
      return status === 'Approved' || status === 'Packed' || status === 'Dispatched';
    }).length;
  }

  get latestOrderTime(): string {
    if (this.totalOrders === 0) {
      return 'No orders';
    }

    const latest = this.orders
      .map((order) => new Date(order.orderDeviceDttm).getTime())
      .reduce((max, current) => Math.max(max, current), 0);

    return new Date(latest).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private rebuildDashboard(): void {
    const receivedCount = this.totalOrders;
    const packedCount = this.countByStatus('Packed');
    const dispatchedCount = this.countByStatus('Dispatched');
    const deliveredCount = this.countByStatus('Delivered');
    this.stageMetrics = [
      {
        label: 'New Orders Received',
        value: receivedCount,
        hint: 'Orders created on the selected date',
        tone: 'accent'
      },
      {
        label: 'Orders Packed',
        value: packedCount,
        hint: 'Now marked packed and ready to move',
        tone: 'warning'
      },
      {
        label: 'Orders Dispatched',
        value: dispatchedCount,
        hint: 'On the road with drivers',
        tone: 'neutral'
      },
      {
        label: 'Orders Delivered',
        value: deliveredCount,
        hint: 'Completed customer fulfilment',
        tone: 'success'
      }
    ];

    this.summaryMetrics = [
      {
        label: 'Total Sales Made',
        value: this.formatMoney(this.totalGrossSales),
        hint: 'Gross order value booked for this date',
        tone: 'accent'
      },
      {
        label: 'Delivered Sales',
        value: this.formatMoney(this.deliveredSales),
        hint: 'Gross value already delivered',
        tone: 'success'
      },
      {
        label: 'Average Order Value',
        value: this.formatMoney(this.averageOrderValue),
        hint: 'Average basket size across all orders',
        tone: 'neutral'
      },
      {
        label: 'Average Items / Order',
        value: this.averageItemsPerOrder.toFixed(1),
        hint: 'Average item quantity across orders',
        tone: 'warning'
      },
      {
        label: 'Average Delivery Charge',
        value: this.formatMoney(this.deliveryChargeAverage),
        hint: 'Average charge applied per order',
        tone: 'neutral'
      },
      {
        label: 'Delivery Conversion',
        value: `${this.conversionRate.toFixed(0)}%`,
        hint: 'Delivered orders as a share of orders received',
        tone: 'success'
      }
    ];

    if (this.inFlightOrders > 0) {
      this.summaryMetrics.unshift({
        label: 'Orders Still In Flight',
        value: `${this.inFlightOrders}`,
        hint: 'Approved, packed, or dispatched but not yet delivered',
        tone: 'warning'
      });
    }
  }

  private countByStatus(status: string): number {
    return this.orders.filter((order) => normalizeOrderStatus(order.status) === status).length;
  }

  formatMoney(value: number): string {
    return `Rs ${Math.round(value || 0).toLocaleString()}`;
  }

  private formatDate(value: string): string {
    return new Date(`${value}T00:00:00`).toLocaleDateString([], {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  private todayIso(): string {
    return new Date().toISOString().split('T')[0];
  }
}
