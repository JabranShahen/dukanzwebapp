import { Component, OnInit } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';

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

  // ── Chart ──────────────────────────────────────────────────
  hourlyChartData: ChartData<'bar'> = { labels: [], datasets: [] };

  readonly chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => items[0].label,
          label: (item) => ` ${item.parsed.y} order${item.parsed.y === 1 ? '' : 's'}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#7a9490',
          font: { size: 11 },
          maxRotation: 0
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#7a9490',
          font: { size: 11 },
          stepSize: 1,
          precision: 0
        },
        grid: { color: 'rgba(20,50,46,0.06)' }
      }
    }
  };

  private buildHourlyChartData(): void {
    const now = new Date();
    const buckets = Array(24).fill(0);
    const labels: string[] = [];

    for (let i = 23; i >= 0; i--) {
      const d = new Date(now);
      d.setHours(d.getHours() - i, 0, 0, 0);
      const h = d.getHours();
      const suffix = h >= 12 ? 'pm' : 'am';
      const display = h === 0 ? '12am' : h <= 12 ? `${h}${suffix}` : `${h - 12}${suffix}`;
      labels.push(display);
    }

    const windowStart = Date.now() - 24 * 3_600_000;
    for (const order of this.outstandingOrders) {
      const t = new Date(order.orderDeviceDttm).getTime();
      if (t < windowStart) continue;
      const diffH = Math.floor((Date.now() - t) / 3_600_000);
      const slot = 23 - diffH;
      if (slot >= 0 && slot < 24) buckets[slot]++;
    }

    const maxVal = Math.max(...buckets, 1);

    this.hourlyChartData = {
      labels,
      datasets: [
        {
          data: buckets,
          backgroundColor: buckets.map((v) =>
            v === maxVal && v > 0 ? 'rgba(37, 99, 235, 0.85)' : 'rgba(37, 99, 235, 0.35)'
          ),
          hoverBackgroundColor: 'rgba(37, 99, 235, 0.75)',
          borderRadius: 4,
          borderSkipped: false
        }
      ]
    };
  }

  // ── Data ───────────────────────────────────────────────────
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
        this.buildHourlyChartData();
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

  get ordersLast24h(): number {
    const windowStart = Date.now() - 24 * 3_600_000;
    return this.outstandingOrders.filter(
      (o) => new Date(o.orderDeviceDttm).getTime() >= windowStart
    ).length;
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
