import { Component, OnInit } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { Product, ProductMutation } from '../models/product.model';
import { ProductCategory } from '../models/product-category.model';
import { BlobStorageService } from '../services/blob-storage.service';
import { ProductService } from '../services/product.service';
import { ProductCategoryService } from '../services/product-category.service';

@Component({
  selector: 'app-product-management',
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.scss']
})
export class ProductManagementComponent implements OnInit {
  loading = true;
  error = '';
  mutationPending = false;
  feedbackMessage = '';
  feedbackTone: 'success' | 'error' = 'success';
  addModalOpen = false;
  editModalOpen = false;
  deleteDialogOpen = false;
  selectedProduct: Product | null = null;
  pendingDeleteProduct: Product | null = null;
  products: Product[] = [];
  categories: ProductCategory[] = [];
  productImageUrls: Record<string, string> = {};

  constructor(
    private readonly productService: ProductService,
    private readonly categoryService: ProductCategoryService,
    private readonly blobStorageService: BlobStorageService
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.productImageUrls = {};

    forkJoin({
      products: this.productService.getAll(),
      categories: this.categoryService.getAll()
    }).subscribe({
      next: ({ products, categories }) => {
        this.products = [...products].sort((a, b) =>
          (a.productName || '').localeCompare(b.productName || '', undefined, { sensitivity: 'base' })
        );
        this.categories = [...categories].sort((a, b) =>
          (a.productCategoryName || '').localeCompare(b.productCategoryName || '', undefined, { sensitivity: 'base' })
        );
        this.hydrateProductImages(this.products);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load master products or compatibility categories from the current API seams.';
      }
    });
  }

  openAddModal(): void {
    this.addModalOpen = true;
    this.feedbackMessage = '';
  }

  closeAddModal(): void {
    if (!this.mutationPending) {
      this.addModalOpen = false;
    }
  }

  openEditModal(product: Product): void {
    this.selectedProduct = {
      ...product,
      productCategory: {
        ...product.productCategory
      }
    };
    this.editModalOpen = true;
    this.feedbackMessage = '';
  }

  closeEditModal(): void {
    if (!this.mutationPending) {
      this.editModalOpen = false;
      this.selectedProduct = null;
    }
  }

  onAddProduct(payload: ProductMutation): void {
    this.mutationPending = true;
    this.resolveProductImagePath(payload).pipe(
      switchMap((imageURL) => this.productService.create({
        ...payload,
        imageURL,
        order: this.getNextProductOrder()
      }))
    ).subscribe({
      next: () => {
        this.mutationPending = false;
        this.addModalOpen = false;
        this.setFeedback('success', 'Master product created.');
        this.reload();
      },
      error: () => {
        this.mutationPending = false;
        this.setFeedback('error', 'Failed to create master product.');
      }
    });
  }

  onEditProduct(payload: ProductMutation): void {
    const existingOrder = this.selectedProduct?.order;
    this.mutationPending = true;
    this.resolveProductImagePath(payload).pipe(
      switchMap((imageURL) => this.productService.update({
        ...payload,
        imageURL,
        ...(typeof existingOrder === 'number' ? { order: existingOrder } : {})
      }))
    ).subscribe({
      next: () => {
        this.mutationPending = false;
        this.editModalOpen = false;
        this.selectedProduct = null;
        this.setFeedback('success', 'Master product updated.');
        this.reload();
      },
      error: () => {
        this.mutationPending = false;
        this.setFeedback('error', 'Failed to update master product.');
      }
    });
  }

  openDeleteDialog(product: Product): void {
    if (this.mutationPending) {
      return;
    }

    this.pendingDeleteProduct = {
      ...product,
      productCategory: {
        ...product.productCategory
      }
    };
    this.deleteDialogOpen = true;
    this.feedbackMessage = '';
  }

  closeDeleteDialog(): void {
    if (!this.mutationPending) {
      this.deleteDialogOpen = false;
      this.pendingDeleteProduct = null;
    }
  }

  confirmDeleteProduct(): void {
    if (!this.pendingDeleteProduct) {
      return;
    }

    this.mutationPending = true;
    this.productService.delete(this.pendingDeleteProduct.id).subscribe({
      next: (deleted) => {
        this.mutationPending = false;
        this.deleteDialogOpen = false;
        this.pendingDeleteProduct = null;
        if (deleted) {
          this.setFeedback('success', 'Master product removed.');
          this.reload();
          return;
        }

        this.setFeedback('error', 'Master product could not be removed.');
      },
      error: () => {
        this.mutationPending = false;
        this.deleteDialogOpen = false;
        this.pendingDeleteProduct = null;
        this.setFeedback('error', 'Failed to remove master product.');
      }
    });
  }

  productCountLabel(): string {
    const count = this.products.length;
    return `${count} master ${count === 1 ? 'product' : 'products'}`;
  }

  deleteDialogMessage(): string {
    if (!this.pendingDeleteProduct) {
      return 'This permanently removes the selected master product.';
    }

    return `This permanently removes "${this.pendingDeleteProduct.productName}" from the master catalog. Retire the product instead when the record should remain available for audit or future event composition.`;
  }

  categoryLabel(product: Product): string {
    if (product.productCategory?.id) {
      return product.productCategory.productCategoryName || 'Legacy category mapped';
    }

    return 'No legacy category mapping';
  }

  compatibilityCopy(product: Product): string {
    if (product.productCategory?.id) {
      return 'Compatibility-only link for current mobile and operator reads.';
    }

    return 'Master data only. No permanent category identity is assigned.';
  }

  priceSummary(product: Product): string {
    return `Now ${this.formatNumber(product.currentPrice)} | Base ${this.formatNumber(product.orignalPrice)} | Cost ${this.formatNumber(product.currentCost)}`;
  }

  unitSummary(product: Product): string {
    return product.unitName ? `Unit: ${product.unitName}` : 'No unit metadata';
  }

  productImageUrl(product: Product): string {
    return this.productImageUrls[product.id] || '';
  }

  productImageState(product: Product): string {
    if (this.productImageUrl(product)) {
      return 'Image loaded';
    }

    return product.imageURL ? 'Image stored' : 'No image';
  }

  statusTone(product: Product): 'success' | 'muted' {
    return product.visible ? 'success' : 'muted';
  }

  statusLabel(product: Product): string {
    return product.visible ? 'Active' : 'Retired';
  }

  trackById(_index: number, item: Product): string {
    return item.id;
  }

  private getNextProductOrder(): number {
    if (this.products.length === 0) {
      return 0;
    }

    return this.products.reduce((maxOrder, product) => Math.max(maxOrder, product.order ?? 0), 0) + 1;
  }

  private setFeedback(tone: 'success' | 'error', message: string): void {
    this.feedbackTone = tone;
    this.feedbackMessage = message;
  }

  private formatNumber(value: number): string {
    return Number(value ?? 0).toFixed(2);
  }

  private hydrateProductImages(products: Product[]): void {
    for (const product of products) {
      const imagePath = (product.imageURL || '').trim();
      if (!imagePath) {
        this.productImageUrls[product.id] = '';
        continue;
      }

      this.blobStorageService.getDownloadUrl(imagePath).subscribe({
        next: (imageUrl) => {
          this.productImageUrls[product.id] = imageUrl || '';
        },
        error: () => {
          this.productImageUrls[product.id] = '';
        }
      });
    }
  }

  private resolveProductImagePath(payload: ProductMutation): Observable<string> {
    if (payload.clearImage) {
      return of('');
    }

    if (payload.imageFile) {
      return this.blobStorageService.uploadImage(payload.imageFile, 'dukanz/products');
    }

    return of((payload.imageURL || '').trim());
  }
}
