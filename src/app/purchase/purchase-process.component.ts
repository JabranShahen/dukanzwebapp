import { Component, OnInit } from '@angular/core';

import { PurchaseSummary, PurchaseDetail, PurchaseDetailItem } from '../models/purchase.model';
import { PurchaseService } from '../services/purchase.service';

interface EditableItem extends PurchaseDetailItem {
  priceInput: number;
}

interface ItemGroup {
  categoryName: string;
  items: EditableItem[];
}

@Component({
  selector: 'app-purchase-process',
  templateUrl: './purchase-process.component.html',
  styleUrls: ['./purchase-process.component.scss']
})
export class PurchaseProcessComponent implements OnInit {
  loadingList = true;
  loadingDetail = false;
  saving = false;
  listError = '';
  detailError = '';
  feedbackMessage = '';
  feedbackTone: 'success' | 'error' = 'success';

  summaries: PurchaseSummary[] = [];
  selectedId = '';
  detail: PurchaseDetail | null = null;
  groups: ItemGroup[] = [];

  constructor(private readonly purchaseService: PurchaseService) {}

  ngOnInit(): void {
    this.loadList();
  }

  loadList(): void {
    this.loadingList = true;
    this.listError = '';
    this.purchaseService.listPurchases().subscribe({
      next: (data) => {
        this.summaries = data;
        this.loadingList = false;
        if (data.length > 0) {
          this.selectPurchase(data[0].id);
        }
      },
      error: () => {
        this.loadingList = false;
        this.listError = 'Failed to load purchases.';
      }
    });
  }

  selectPurchase(id: string): void {
    this.selectedId = id;
    this.loadDetail(id);
  }

  loadDetail(dateKey: string): void {
    this.loadingDetail = true;
    this.detailError = '';
    this.detail = null;
    this.groups = [];
    this.purchaseService.getPurchase(dateKey).subscribe({
      next: (data) => {
        this.detail = data;
        this.buildGroups(data);
        this.loadingDetail = false;
      },
      error: () => {
        this.loadingDetail = false;
        this.detailError = 'Failed to load purchase details.';
      }
    });
  }

  private buildGroups(detail: PurchaseDetail): void {
    const map = new Map<string, EditableItem[]>();
    for (const item of detail.items) {
      const cat = item.categoryName || 'Uncategorised';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push({ ...item, priceInput: item.pricePerQty });
    }
    this.groups = Array.from(map.entries()).map(([categoryName, items]) => ({ categoryName, items }));
  }

  rowTotal(item: EditableItem): number {
    return Math.round(item.priceInput * item.quantity * 10) / 10;
  }

  get grandTotal(): number {
    return this.groups
      .flatMap(g => g.items)
      .reduce((sum, i) => sum + this.rowTotal(i), 0);
  }

  onSave(): void {
    if (!this.detail) return;
    this.saving = true;
    const items = this.groups
      .flatMap(g => g.items)
      .map(i => ({ id: i.id, pricePerQty: i.priceInput }));
    this.purchaseService.processPurchase(this.detail.id, items).subscribe({
      next: () => {
        this.saving = false;
        this.feedbackTone = 'success';
        this.feedbackMessage = 'Purchase saved successfully.';
        this.loadDetail(this.selectedId);
      },
      error: () => {
        this.saving = false;
        this.feedbackTone = 'error';
        this.feedbackMessage = 'Failed to save purchase.';
      }
    });
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  }

  statusTone(status: string): string {
    switch ((status ?? '').toLowerCase()) {
      case 'purchased':    return 'success';
      case 'out of stock': return 'danger';
      case 'partial':      return 'warning';
      default:             return 'pending';
    }
  }

  onFeedbackDismissed(): void {
    this.feedbackMessage = '';
  }
}
