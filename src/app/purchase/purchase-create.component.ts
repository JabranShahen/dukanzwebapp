import { Component, OnInit } from '@angular/core';

import { PurchasePreview } from '../models/purchase.model';
import { PurchaseService } from '../services/purchase.service';

type PdfLine = {
  text: string;
  size?: number;
  bold?: boolean;
};

@Component({
  selector: 'app-purchase-create',
  templateUrl: './purchase-create.component.html',
  styleUrls: ['./purchase-create.component.scss']
})
export class PurchaseCreateComponent implements OnInit {
  loading = true;
  creating = false;
  exportingPdf = false;
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

  downloadPdf(): void {
    if (!this.preview?.alreadyCreated || this.exportingPdf) {
      return;
    }

    this.exportingPdf = true;

    try {
      const blob = this.buildPurchasePdf(this.preview);
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `purchase-${this.preview.purchaseDateKey}.pdf`;
      link.click();
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 0);
    } catch {
      this.feedbackTone = 'error';
      this.feedbackMessage = 'Failed to generate purchase PDF.';
    } finally {
      this.exportingPdf = false;
    }
  }

  onFeedbackDismissed(): void {
    this.feedbackMessage = '';
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
      { text: `Order window: ${this.formatDate(preview.windowStart)} -> ${this.formatDate(preview.windowEnd)}` },
      { text: `Delivery date: ${this.formatDate(preview.deliveryDate)}` },
      { text: `Orders: ${preview.orderCount}` },
      { text: `Products: ${this.totalItems}` },
      { text: '' }
    ];

    preview.categories.forEach((category, index) => {
      lines.push(
        { text: `${category.categoryName} (${category.items.length} item${category.items.length !== 1 ? 's' : ''})`, size: 12, bold: true }
      );

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
