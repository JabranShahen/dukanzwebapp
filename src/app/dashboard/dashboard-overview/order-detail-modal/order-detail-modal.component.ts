import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output
} from '@angular/core';

import { normalizeOrderStatus } from '../../../models/order.model';
import { Order } from '../../../models/order.model';

@Component({
  selector: 'app-order-detail-modal',
  templateUrl: './order-detail-modal.component.html',
  styleUrls: ['./order-detail-modal.component.scss']
})
export class OrderDetailModalComponent {
  @Input() order!: Order;
  @Output() closed = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closed.emit();
    }
  }

  statusTone(status: string): string {
    switch (normalizeOrderStatus(status)) {
      case 'Approved':
        return 'pending';
      case 'Packed':
        return 'info';
      case 'Dispatched':
        return 'warning';
      case 'Delivered':
        return 'success';
      default:
        return 'muted';
    }
  }

  displayStatus(status: string): string {
    return normalizeOrderStatus(status) || status;
  }

  formatDateTime(dttm: string): string {
    if (!dttm) return '—';
    const d = new Date(dttm);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatAge(dttm: string): string {
    const diffMs = Date.now() - new Date(dttm).getTime();
    const diffH = Math.floor(diffMs / 3_600_000);
    const diffM = Math.floor(diffMs / 60_000);
    if (diffH >= 48) return `${Math.floor(diffH / 24)} days ago`;
    if (diffH >= 1) return `${diffH}h ago`;
    if (diffM >= 1) return `${diffM}m ago`;
    return 'just now';
  }

  get isLate(): boolean {
    const diffMs = Date.now() - new Date(this.order.orderDeviceDttm).getTime();
    return diffMs > 24 * 3_600_000;
  }
}
