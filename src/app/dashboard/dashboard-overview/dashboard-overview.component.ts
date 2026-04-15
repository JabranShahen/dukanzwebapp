import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ChartData, ChartOptions } from 'chart.js';

import { Order, OrderStatus, ACTIVE_ORDER_STATUSES } from '../../models/order.model';
import { OrderService } from '../../services/order.service';

// All statuses in display order with their chart colours
const STATUS_PALETTE: Record<OrderStatus, string> = {
  Approved:   '#0d9488',  // teal
  Processing: '#f59e0b',  // amber
  Dispatched: '#f97316',  // orange
  Delivered:  '#16a34a',  // green
  Declined:   '#dc2626',  // red
  Cancelled:  '#6b7280',  // gray
};

const ALL_STATUSES = Object.keys(STATUS_PALETTE) as OrderStatus[];

@Component({
  selector: 'app-dashboard-overview',
  templateUrl: './dashboard-overview.component.html',
  styleUrls: ['./dashboard-overview.component.scss']
})
export class DashboardOverviewComponent implements OnInit {
  loading = true;
  error = '';
  outstandingOrders: Order[] = [];   // active only — used for stat cards + table
  allRecentOrders: Order[] = [];     // all statuses, last 7 days — used for chart
  selectedOrder: Order | null = null;

  // ── Chart ──────────────────────────────────────────────────
  hourlyChartData: ChartData<'line'> = { labels: [], datasets: [] };

  readonly chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: '#3d5a57',
          font: { size: 11 },
          boxWidth: 12,
          padding: 16,
          usePointStyle: true,
          filter: (item) => {
            // Hide legend entries for statuses with no data
            const ds = this.hourlyChartData.datasets[item.datasetIndex!];
            return ds ? (ds.data as number[]).some((v) => v > 0) : false;
          }
        }
      },
      tooltip: {
        callbacks: {
          title: (items) => items[0].label,
          label: (item) =>
            ` ${item.dataset.label}: ${item.parsed.y} order${item.parsed.y === 1 ? '' : 's'}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#7a9490',
          font: { size: 11 },
          maxRotation: 0,
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
    const DAYS = 7;
    const labels: string[] = [];
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Build 7 day-slot labels (oldest → today)
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : DAY_NAMES[d.getDay()];
      labels.push(label);
    }

    // One bucket array per status
    const statusBuckets: Record<string, number[]> = {};
    for (const s of ALL_STATUSES) {
      statusBuckets[s] = Array(DAYS).fill(0);
    }

    const windowStart = Date.now() - DAYS * 24 * 3_600_000;
    for (const order of this.allRecentOrders) {
      const t = new Date(order.orderDeviceDttm).getTime();
      if (t < windowStart) continue;
      const diffDays = Math.floor((Date.now() - t) / (24 * 3_600_000));
      const slot = (DAYS - 1) - diffDays;
      if (slot >= 0 && slot < DAYS && statusBuckets[order.status]) {
        statusBuckets[order.status][slot]++;
      }
    }

    this.hourlyChartData = {
      labels,
      datasets: ALL_STATUSES.map((status) => {
        const colour = STATUS_PALETTE[status];
        return {
          label: status,
          data: statusBuckets[status],
          borderColor: colour,
          backgroundColor: colour + '1a',   // 10% opacity fill
          pointBackgroundColor: colour,
          pointRadius: 3,
          pointHoverRadius: 5,
          borderWidth: 2,
          tension: 0.35,
          fill: false,
        };
      })
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

    // Build requests for each of the last 7 days
    const today = new Date();
    const dailyRequests = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return this.orderService.getOrdersForDate(d);
    });

    forkJoin({
      outstanding: this.orderService.getOutstandingOrders(),
      daily: forkJoin(dailyRequests),
    }).subscribe({
      next: ({ outstanding, daily }) => {
        this.outstandingOrders = outstanding;
        // Deduplicate across day boundaries using order id
        const seen = new Set<string>();
        this.allRecentOrders = daily.flat().filter((o) => {
          if (seen.has(o.id)) return false;
          seen.add(o.id);
          return true;
        });
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

  get ordersLast7d(): number {
    return this.allRecentOrders.length;
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
      case 'Approved':
        return 'pending';
      case 'Processing':
        return 'info';
      case 'Dispatched':
        return 'warning';
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
