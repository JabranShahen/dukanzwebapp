import { Component, OnInit } from '@angular/core';

import {
  MarkPackedResult,
  PackingBatchDetail,
  PackingBatchSummary,
  PackingOrderSummary
} from '../models/packing.model';
import { PackingService } from '../services/packing.service';

@Component({
  selector: 'app-packing-report',
  templateUrl: './packing-report.component.html',
  styleUrls: ['./packing-report.component.scss']
})
export class PackingReportComponent implements OnInit {
  loadingList = true;
  loadingDetail = false;
  saving = false;

  listError = '';
  detailError = '';
  feedbackMessage = '';
  feedbackTone: 'success' | 'error' = 'success';

  batches: PackingBatchSummary[] = [];
  selectedBatchKey = '';
  detail: PackingBatchDetail | null = null;
  selectedOrderIds = new Set<string>();

  constructor(private readonly packingService: PackingService) {}

  ngOnInit(): void {
    this.loadBatches();
  }

  loadBatches(): void {
    this.loadingList = true;
    this.listError = '';
    this.selectedOrderIds.clear();

    this.packingService.listBatches().subscribe({
      next: (batches) => {
        this.loadingList = false;
        this.batches = batches;

        if (batches.length === 0) {
          this.selectedBatchKey = '';
          this.detail = null;
          return;
        }

        const nextSelectedKey = batches.some((batch) => batch.purchaseDateKey === this.selectedBatchKey)
          ? this.selectedBatchKey
          : batches[0].purchaseDateKey;
        this.selectBatch(nextSelectedKey);
      },
      error: () => {
        this.loadingList = false;
        this.listError = 'Failed to load packing batches.';
      }
    });
  }

  selectBatch(purchaseDateKey: string): void {
    if (!purchaseDateKey) {
      return;
    }

    this.selectedBatchKey = purchaseDateKey;
    this.loadBatchDetail(purchaseDateKey);
  }

  loadBatchDetail(purchaseDateKey: string): void {
    this.loadingDetail = true;
    this.detailError = '';
    this.detail = null;
    this.selectedOrderIds.clear();

    this.packingService.getBatch(purchaseDateKey).subscribe({
      next: (detail) => {
        this.loadingDetail = false;
        this.detail = detail;
        this.pruneSelection();
      },
      error: () => {
        this.loadingDetail = false;
        this.detailError = 'Failed to load packing details.';
      }
    });
  }

  toggleOrder(orderId: string, checked: boolean): void {
    if (checked) {
      this.selectedOrderIds.add(orderId);
      return;
    }

    this.selectedOrderIds.delete(orderId);
  }

  isSelected(orderId: string): boolean {
    return this.selectedOrderIds.has(orderId);
  }

  isSelectable(order: PackingOrderSummary): boolean {
    return order.packingState === 'Ready';
  }

  get hasReadyOrders(): boolean {
    return (this.detail?.orders ?? []).some((order) => this.isSelectable(order));
  }

  get selectedCount(): number {
    return this.selectedOrderIds.size;
  }

  markPacked(): void {
    if (!this.detail || this.selectedOrderIds.size === 0 || this.saving) {
      return;
    }

    this.saving = true;
    const selectedIds = Array.from(this.selectedOrderIds);

    this.packingService.markPacked(this.detail.purchaseDateKey, selectedIds).subscribe({
      next: (result) => {
        this.saving = false;
        this.feedbackTone = 'success';
        this.feedbackMessage = this.buildFeedbackMessage(result);
        this.loadBatchDetail(this.detail!.purchaseDateKey);
      },
      error: () => {
        this.saving = false;
        this.feedbackTone = 'error';
        this.feedbackMessage = 'Failed to mark packed orders.';
      }
    });
  }

  shortOrderId(id: string): string {
    return ('ORD#' + (id || '').slice(-5)).toUpperCase();
  }

  formatDate(value: string, withTime = false): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    return date.toLocaleString([], withTime
      ? { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
      : { weekday: 'short', day: 'numeric', month: 'short' });
  }

  statusTone(status: string): string {
    switch ((status ?? '').toLowerCase()) {
      case 'purchased':
      case 'ready':
      case 'delivered':
        return 'success';
      case 'partial':
      case 'packed':
      case 'processing':
      case 'dispatched':
        return 'warning';
      case 'blocked':
      case 'out of stock':
      case 'declined':
      case 'cancelled':
        return 'danger';
      default:
        return 'pending';
    }
  }

  stateDescription(reason: string): string {
    switch (reason) {
      case 'BlockedByOutOfStock':
        return 'Blocked by out-of-stock items';
      case 'BlockedByMissingPurchaseItem':
        return 'Blocked by missing purchase item mapping';
      case 'OrderNotApproved':
        return 'Order is no longer awaiting packing';
      default:
        return '';
    }
  }

  onFeedbackDismissed(): void {
    this.feedbackMessage = '';
  }

  private pruneSelection(): void {
    if (!this.detail) {
      this.selectedOrderIds.clear();
      return;
    }

    const selectableIds = new Set(
      this.detail.orders.filter((order) => this.isSelectable(order)).map((order) => order.orderId)
    );

    this.selectedOrderIds.forEach((orderId) => {
      if (!selectableIds.has(orderId)) {
        this.selectedOrderIds.delete(orderId);
      }
    });
  }

  private buildFeedbackMessage(result: MarkPackedResult): string {
    const packedCount = result.updatedOrderIds.length;
    const skippedCount = result.skippedOrders.length;
    if (skippedCount === 0) {
      return `${packedCount} order${packedCount !== 1 ? 's' : ''} marked packed.`;
    }

    return `${packedCount} order${packedCount !== 1 ? 's' : ''} marked packed, ${skippedCount} skipped.`;
  }
}
