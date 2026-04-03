import { Component, OnInit } from '@angular/core';

import { PurchasePreview } from '../models/purchase.model';
import { PurchaseService } from '../services/purchase.service';

@Component({
  selector: 'app-purchase-create',
  templateUrl: './purchase-create.component.html',
  styleUrls: ['./purchase-create.component.scss']
})
export class PurchaseCreateComponent implements OnInit {
  loading = true;
  creating = false;
  loadError = '';
  feedbackMessage = '';
  feedbackTone: 'success' | 'error' = 'success';

  preview: PurchasePreview | null = null;

  constructor(private readonly purchaseService: PurchaseService) {}

  ngOnInit(): void {
    this.loadPreview();
  }

  loadPreview(): void {
    this.loading = true;
    this.loadError = '';
    this.purchaseService.getPreview().subscribe({
      next: (data) => {
        this.preview = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.loadError = 'Failed to load purchase preview. Check your connection.';
      }
    });
  }

  get totalItems(): number {
    return (this.preview?.categories ?? []).reduce(
      (sum, cat) => sum + cat.items.length, 0
    );
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  onCreatePurchase(): void {
    this.creating = true;
    this.purchaseService.createPurchase().subscribe({
      next: () => {
        this.creating = false;
        this.feedbackTone = 'success';
        this.feedbackMessage = 'Purchase created successfully.';
        if (this.preview) {
          this.preview.alreadyCreated = true;
        }
      },
      error: () => {
        this.creating = false;
        this.feedbackTone = 'error';
        this.feedbackMessage = 'Failed to create purchase.';
      }
    });
  }

  onFeedbackDismissed(): void {
    this.feedbackMessage = '';
  }
}
