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
  savingOrderIds = new Set<string>();

  constructor(private readonly packingService: PackingService) {}

  ngOnInit(): void {
    this.loadBatches();
  }

  loadBatches(): void {
    this.loadingList = true;
    this.listError = '';
    this.savingOrderIds.clear();

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
    this.savingOrderIds.clear();

    this.packingService.getBatch(purchaseDateKey).subscribe({
      next: (detail) => {
        this.loadingDetail = false;
        this.detail = detail;
      },
      error: () => {
        this.loadingDetail = false;
        this.detailError = 'Failed to load packing details.';
      }
    });
  }

  isSelectable(order: PackingOrderSummary): boolean {
    return order.packingState === 'Ready';
  }

  isSavingOrder(orderId: string): boolean {
    return this.savingOrderIds.has(orderId);
  }

  get hasReadyOrders(): boolean {
    return (this.detail?.orders ?? []).some((order) => this.isSelectable(order));
  }

  markOrderPacked(order: PackingOrderSummary): void {
    if (!this.detail || !this.isSelectable(order) || this.isSavingOrder(order.orderId)) {
      return;
    }

    this.savingOrderIds.add(order.orderId);
    this.saving = true;
    const batchKey = this.detail.purchaseDateKey;

    this.packingService.markPacked(batchKey, [order.orderId]).subscribe({
      next: (result) => {
        this.savingOrderIds.delete(order.orderId);
        this.saving = this.savingOrderIds.size > 0;
        this.feedbackTone = 'success';
        if (result.updatedOrderIds.includes(order.orderId)) {
          this.removePackedOrder(order.orderId);
          this.feedbackMessage = `${this.shortOrderId(order.orderId)} marked packed.`;
          return;
        }

        this.feedbackMessage = this.buildFeedbackMessage(result);
      },
      error: () => {
        this.savingOrderIds.delete(order.orderId);
        this.saving = this.savingOrderIds.size > 0;
        this.feedbackTone = 'error';
        this.feedbackMessage = `Failed to mark ${this.shortOrderId(order.orderId)} as packed.`;
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

  private removePackedOrder(orderId: string): void {
    if (!this.detail) {
      return;
    }

    const removedOrder = this.detail.orders.find((order) => order.orderId === orderId);
    if (!removedOrder) {
      return;
    }

    const remainingOrders = this.detail.orders.filter((order) => order.orderId !== orderId);
    const nextDetail: PackingBatchDetail = {
      ...this.detail,
      orders: remainingOrders,
      orderCount: Math.max(0, this.detail.orderCount - 1),
      readyOrderCount: this.isSelectable(removedOrder)
        ? Math.max(0, this.detail.readyOrderCount - 1)
        : this.detail.readyOrderCount,
      blockedOrderCount: removedOrder.packingState === 'Blocked'
        ? Math.max(0, this.detail.blockedOrderCount - 1)
        : this.detail.blockedOrderCount,
      packedOrderCount: this.detail.packedOrderCount + 1
    };

    this.detail = nextDetail;

    const batchIndex = this.batches.findIndex((batch) => batch.purchaseDateKey === nextDetail.purchaseDateKey);
    if (batchIndex === -1) {
      return;
    }

    const batch = this.batches[batchIndex];
    this.batches[batchIndex] = {
      ...batch,
      orderCount: Math.max(0, batch.orderCount - 1),
      readyOrderCount: this.isSelectable(removedOrder)
        ? Math.max(0, batch.readyOrderCount - 1)
        : batch.readyOrderCount,
      blockedOrderCount: removedOrder.packingState === 'Blocked'
        ? Math.max(0, batch.blockedOrderCount - 1)
        : batch.blockedOrderCount,
      packedOrderCount: batch.packedOrderCount + 1
    };
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
