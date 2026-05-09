import { Component, OnInit } from '@angular/core';

import { Order } from '../models/order.model';
import {
  PurchaseDetail,
  PurchaseDetailItem,
  PurchaseOrderSummary,
  PurchasePreview,
  PurchaseSummary
} from '../models/purchase.model';
import { OrderService } from '../services/order.service';
import { PurchaseService } from '../services/purchase.service';

type PdfLine = {
  text: string;
  size?: number;
  bold?: boolean;
};

interface EditableItem extends PurchaseDetailItem {
  priceInput: number;
}

interface ItemGroup {
  categoryName: string;
  items: EditableItem[];
}

@Component({
  selector: 'app-purchase-management',
  templateUrl: './purchase-management.component.html',
  styleUrls: ['./purchase-management.component.scss']
})
export class PurchaseManagementComponent implements OnInit {
  viewMode: 'list' | 'process' = 'list';
  processingPurchaseId: string | null = null;

  loadingPreview = true;
  previewError = '';
  preview: PurchasePreview | null = null;
  creating = false;
  showPreviewOrders = false;
  loadingPreviewOrders = false;
  previewOrders: Order[] = [];
  exportingPdf = false;

  loadingList = false;
  listError = '';
  summaries: PurchaseSummary[] = [];
  deletingId: string | null = null;
  selectedHistoryDateKey = '';

  expandedSummaryOrderIds = new Set<string>();
  loadingSummaryOrderIds = new Set<string>();
  summaryOrdersByPurchaseId = new Map<string, PurchaseOrderSummary[]>();

  loadingDetail = false;
  detailError = '';
  detail: PurchaseDetail | null = null;
  groups: ItemGroup[] = [];
  saving = false;
  showDetailOrders = false;
  loadingDetailOrders = false;
  detailOrders: PurchaseOrderSummary[] = [];

  feedbackMessage = '';
  feedbackTone: 'success' | 'error' = 'success';

  constructor(
    private readonly purchaseService: PurchaseService,
    private readonly orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.loadPreview();
    this.loadList();
  }

  loadPreview(): void {
    this.loadingPreview = true;
    this.previewError = '';
    this.showPreviewOrders = false;
    this.previewOrders = [];

    this.purchaseService.getPreview().subscribe({
      next: (data) => {
        this.preview = data;
        if (!this.selectedHistoryDateKey) {
          this.selectedHistoryDateKey = data.purchaseDateKey;
        }
        this.loadingPreview = false;
      },
      error: () => {
        this.loadingPreview = false;
        this.previewError = 'Failed to load purchase preview. Check your connection.';
      }
    });
  }

  loadList(dateKey = this.selectedHistoryDateKey): void {
    this.loadingList = true;
    this.listError = '';
    this.expandedSummaryOrderIds.clear();
    this.loadingSummaryOrderIds.clear();
    this.summaryOrdersByPurchaseId.clear();

    const selectedDateKey = (dateKey || '').trim();
    this.purchaseService.listPurchases(selectedDateKey || undefined).subscribe({
      next: (data) => {
        this.summaries = Array.isArray(data) ? data : [];
        this.loadingList = false;
      },
      error: () => {
        this.loadingList = false;
        this.listError = 'Failed to load purchases.';
      }
    });
  }

  onHistoryDateChange(): void {
    this.loadList();
  }

  resetHistoryDateToCurrent(): void {
    this.selectedHistoryDateKey = this.preview?.purchaseDateKey ?? '';
    this.loadList();
  }

  onCreatePurchase(): void {
    if (this.creating) return;

    this.creating = true;
    this.purchaseService.createPurchase().subscribe({
      next: () => {
        this.creating = false;
        this.feedbackTone = 'success';
        this.feedbackMessage = 'Purchase created successfully.';
        if (this.preview?.purchaseDateKey) {
          this.selectedHistoryDateKey = this.preview.purchaseDateKey;
        }
        this.loadPreview();
        this.loadList();
      },
      error: () => {
        this.creating = false;
        this.feedbackTone = 'error';
        this.feedbackMessage = 'Failed to create purchase.';
      }
    });
  }

  togglePreviewOrders(): void {
    if (this.showPreviewOrders) {
      this.showPreviewOrders = false;
      return;
    }

    this.showPreviewOrders = true;
    if (this.previewOrders.length > 0) return;

    this.loadingPreviewOrders = true;
    this.orderService.getOrdersByIds(this.preview?.orderIds ?? []).subscribe({
      next: (data) => {
        this.previewOrders = data;
        this.loadingPreviewOrders = false;
      },
      error: () => {
        this.loadingPreviewOrders = false;
      }
    });
  }

  toggleSummaryOrders(purchaseId: string): void {
    if (this.expandedSummaryOrderIds.has(purchaseId)) {
      this.expandedSummaryOrderIds.delete(purchaseId);
      return;
    }

    this.expandedSummaryOrderIds.add(purchaseId);
    if (this.summaryOrdersByPurchaseId.has(purchaseId)) return;

    this.loadingSummaryOrderIds.add(purchaseId);
    this.purchaseService.getOrdersForPurchase(purchaseId).subscribe({
      next: (data) => {
        this.summaryOrdersByPurchaseId.set(purchaseId, data);
        this.loadingSummaryOrderIds.delete(purchaseId);
      },
      error: () => {
        this.summaryOrdersByPurchaseId.set(purchaseId, []);
        this.loadingSummaryOrderIds.delete(purchaseId);
      }
    });
  }

  isSummaryOrdersExpanded(purchaseId: string): boolean {
    return this.expandedSummaryOrderIds.has(purchaseId);
  }

  isSummaryOrdersLoading(purchaseId: string): boolean {
    return this.loadingSummaryOrderIds.has(purchaseId);
  }

  getSummaryOrders(purchaseId: string): PurchaseOrderSummary[] {
    return this.summaryOrdersByPurchaseId.get(purchaseId) ?? [];
  }

  openProcess(purchaseId: string): void {
    this.viewMode = 'process';
    this.processingPurchaseId = purchaseId;
    this.showDetailOrders = false;
    this.detailOrders = [];
    this.loadDetail(purchaseId);
  }

  backToList(): void {
    this.viewMode = 'list';
    this.processingPurchaseId = null;
    this.detail = null;
    this.groups = [];
    this.showDetailOrders = false;
    this.detailOrders = [];
    this.loadPreview();
    this.loadList();
  }

  onDelete(purchaseId: string): void {
    if (this.deletingId) return;

    this.deletingId = purchaseId;
    this.purchaseService.deletePurchase(purchaseId).subscribe({
      next: () => {
        this.deletingId = null;
        this.feedbackTone = 'success';
        this.feedbackMessage = 'Purchase deleted.';
        this.loadPreview();
        this.loadList();
      },
      error: () => {
        this.deletingId = null;
        this.feedbackTone = 'error';
        this.feedbackMessage = 'Failed to delete purchase.';
      }
    });
  }

  loadDetail(id: string): void {
    this.loadingDetail = true;
    this.detailError = '';
    this.detail = null;
    this.groups = [];

    this.purchaseService.getPurchase(id).subscribe({
      next: (data) => {
        this.detail = data;
        this.buildGroups(data);
        this.loadingDetail = false;
      },
      error: (err) => {
        this.loadingDetail = false;
        this.detailError = err?.status === 403
          ? 'Access denied — this purchase belongs to a different area.'
          : 'Failed to load purchase details.';
      }
    });
  }

  toggleDetailOrders(): void {
    if (this.showDetailOrders) {
      this.showDetailOrders = false;
      return;
    }

    this.showDetailOrders = true;
    if (this.detailOrders.length > 0 || !this.processingPurchaseId) return;

    this.loadingDetailOrders = true;
    this.purchaseService.getOrdersForPurchase(this.processingPurchaseId).subscribe({
      next: (data) => {
        this.detailOrders = data;
        this.loadingDetailOrders = false;
      },
      error: () => {
        this.loadingDetailOrders = false;
      }
    });
  }

  onSave(): void {
    if (!this.detail || this.saving) return;

    this.saving = true;
    const items = this.groups
      .flatMap(g => g.items)
      .map(i => ({ id: i.id, pricePerQty: i.priceInput }));

    this.purchaseService.processPurchase(this.detail.id, items).subscribe({
      next: () => {
        this.saving = false;
        this.feedbackTone = 'success';
        this.feedbackMessage = 'Purchase saved successfully.';
        this.loadDetail(this.detail!.id);
      },
      error: () => {
        this.saving = false;
        this.feedbackTone = 'error';
        this.feedbackMessage = 'Failed to save purchase.';
      }
    });
  }

  downloadPdf(): void {
    if (!this.preview?.alreadyCreated || this.exportingPdf) return;

    this.exportingPdf = true;

    try {
      const blob = this.buildPurchasePdf(this.preview);
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `purchase-${this.detail?.areaId ? this.detail.areaId + '-' : ''}${this.preview.purchaseDateKey}.pdf`;
      link.click();
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
    } catch {
      this.feedbackTone = 'error';
      this.feedbackMessage = 'Failed to generate purchase PDF.';
    } finally {
      this.exportingPdf = false;
    }
  }

  rowTotal(item: EditableItem): number {
    return Math.round((item.priceInput || 0) * item.quantity * 100) / 100;
  }

  get grandTotal(): number {
    return this.groups
      .flatMap(g => g.items)
      .reduce((sum, item) => sum + this.rowTotal(item), 0);
  }

  get totalItems(): number {
    return (this.preview?.categories ?? []).reduce(
      (sum, category) => sum + category.items.length,
      0
    );
  }

  formatDate(iso: string | null | undefined): string {
    if (!iso) return '';
    const date = new Date(iso);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPrice(value: number): string {
    return 'Rs ' + (value || 0).toLocaleString();
  }

  shortId(id: string | null | undefined): string {
    return '...' + (id || '').slice(-8);
  }

  statusTone(status: string | null | undefined): string {
    switch ((status ?? '').toLowerCase()) {
      case 'purchased': return 'success';
      case 'out of stock': return 'danger';
      case 'partial': return 'warning';
      default: return 'pending';
    }
  }

  onFeedbackDismissed(): void {
    this.feedbackMessage = '';
  }

  private buildGroups(detail: PurchaseDetail): void {
    const map = new Map<string, EditableItem[]>();
    for (const item of detail.items) {
      const categoryName = item.categoryName || 'Uncategorised';
      if (!map.has(categoryName)) {
        map.set(categoryName, []);
      }
      map.get(categoryName)!.push({ ...item, priceInput: item.pricePerQty });
    }

    this.groups = Array.from(map.entries()).map(([categoryName, items]) => ({
      categoryName,
      items
    }));
  }

  private buildPurchasePdf(preview: PurchasePreview): Blob {
    const lines = this.buildPdfLines(preview);
    const pages = this.paginatePdfLines(lines);

    const pageWidth = 595;
    const pageHeight = 842;
    const objects: string[] = [];
    const pageObjectNumbers: number[] = [];

    objects.push('<< /Type /Catalog /Pages 2 0 R >>');
    objects.push('PAGES_PLACEHOLDER');
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

    pages.forEach((pageLines) => {
      const pageObjectNumber = objects.length + 1;
      const contentObjectNumber = objects.length + 2;
      pageObjectNumbers.push(pageObjectNumber);

      objects.push(
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
      );

      const contentStream = this.buildPdfContentStream(pageLines, pageHeight);
      objects.push(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream`);
    });

    objects[1] = `<< /Type /Pages /Count ${pageObjectNumbers.length} /Kids [${pageObjectNumbers.map((id) => `${id} 0 R`).join(' ')}] >>`;

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [0];

    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    offsets.slice(1).forEach((offset) => {
      pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return new Blob([pdf], { type: 'application/pdf' });
  }

  private buildPdfLines(preview: PurchasePreview): PdfLine[] {
    const lines: PdfLine[] = [
      { text: 'Dukanz Purchase Sheet', size: 18, bold: true },
      { text: `Batch ${preview.purchaseDateKey}`, size: 12, bold: true },
      { text: `Area: ${this.detail?.areaId || 'N/A'}` },
      { text: `Order window: ${this.formatDate(preview.windowStart)} -> ${this.formatDate(preview.windowEnd)}` },
      { text: `Delivery date: ${this.formatDate(preview.deliveryDate)}` },
      { text: `Orders: ${preview.orderCount}` },
      { text: `Products: ${this.totalItems}` },
      { text: '' }
    ];

    preview.categories.forEach((category, index) => {
      lines.push({
        text: `${category.categoryName} (${category.items.length} item${category.items.length !== 1 ? 's' : ''})`,
        size: 12,
        bold: true
      });

      if (category.items.length === 0) {
        lines.push({ text: 'No items in this category.' });
      } else {
        category.items.forEach((item) => {
          this.wrapPdfText(
            `- ${item.productName} | Qty ${item.totalQuantity} | ${item.unitName || 'n/a'}`,
            86
          ).forEach((text) => lines.push({ text }));
        });
      }

      if (index < preview.categories.length - 1) {
        lines.push({ text: '' });
      }
    });

    return lines;
  }

  private paginatePdfLines(lines: PdfLine[]): PdfLine[][] {
    const pages: PdfLine[][] = [];
    let page: PdfLine[] = [];
    let usedHeight = 0;
    const availableHeight = 760;

    lines.forEach((line) => {
      const lineHeight = (line.size ?? 10) + 6;
      if (page.length > 0 && usedHeight + lineHeight > availableHeight) {
        pages.push(page);
        page = [];
        usedHeight = 0;
      }

      page.push(line);
      usedHeight += lineHeight;
    });

    if (page.length > 0) {
      pages.push(page);
    }

    return pages.length > 0 ? pages : [[{ text: 'No purchase data available.' }]];
  }

  private buildPdfContentStream(lines: PdfLine[], pageHeight: number): string {
    const commands: string[] = ['BT'];
    let y = pageHeight - 44;

    lines.forEach((line) => {
      const fontName = line.bold ? '/F2' : '/F1';
      const fontSize = line.size ?? 10;
      const safeText = this.escapePdfText(line.text);
      commands.push(`${fontName} ${fontSize} Tf`);
      commands.push(`1 0 0 1 40 ${y} Tm`);
      commands.push(`(${safeText}) Tj`);
      y -= fontSize + 6;
    });

    commands.push('ET');
    return commands.join('\n');
  }

  private wrapPdfText(text: string, maxChars: number): string[] {
    const normalized = (text || '').trim();
    if (!normalized) {
      return [''];
    }

    const words = normalized.split(/\s+/);
    const lines: string[] = [];
    let current = '';

    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length <= maxChars) {
        current = candidate;
        return;
      }

      if (current) {
        lines.push(current);
      }
      current = word;
    });

    if (current) {
      lines.push(current);
    }

    return lines;
  }

  private escapePdfText(text: string): string {
    return (text || '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/[^\x20-\x7E]/g, '?');
  }
}
