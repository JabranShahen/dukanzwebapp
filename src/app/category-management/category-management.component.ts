import { Component, OnInit } from '@angular/core';

import { ProductCategory, ProductCategoryMutation } from '../models/product-category.model';
import { ProductCategoryService } from '../services/product-category.service';

@Component({
  selector: 'app-category-management',
  templateUrl: './category-management.component.html',
  styleUrls: ['./category-management.component.scss']
})
export class CategoryManagementComponent implements OnInit {
  loading = true;
  error = '';
  mutationPending = false;
  feedbackMessage = '';
  feedbackTone: 'success' | 'error' = 'success';
  addModalOpen = false;
  editModalOpen = false;
  deleteDialogOpen = false;
  selectedCategory: ProductCategory | null = null;
  pendingDeleteCategory: ProductCategory | null = null;
  categories: ProductCategory[] = [];

  constructor(private readonly categoryService: ProductCategoryService) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = '';

    this.categoryService.getAll().subscribe({
      next: (categories) => {
        this.categories = [...categories].sort((a, b) =>
          (a.productCategoryName || '').localeCompare(b.productCategoryName || '', undefined, { sensitivity: 'base' })
        );
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load master categories from the ProductCategory endpoint.';
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

  openEditModal(category: ProductCategory): void {
    this.selectedCategory = { ...category };
    this.editModalOpen = true;
    this.feedbackMessage = '';
  }

  closeEditModal(): void {
    if (!this.mutationPending) {
      this.editModalOpen = false;
      this.selectedCategory = null;
    }
  }

  onAddCategory(payload: ProductCategoryMutation): void {
    this.mutationPending = true;
    this.categoryService.create({
      ...payload,
      order: this.getNextCategoryOrder()
    }).subscribe({
      next: () => {
        this.mutationPending = false;
        this.addModalOpen = false;
        this.setFeedback('success', 'Master category created.');
        this.reload();
      },
      error: () => {
        this.mutationPending = false;
        this.setFeedback('error', 'Failed to create master category.');
      }
    });
  }

  onEditCategory(payload: ProductCategoryMutation): void {
    const existingOrder = this.selectedCategory?.order;
    this.mutationPending = true;
    this.categoryService.update({
      ...payload,
      ...(typeof existingOrder === 'number' ? { order: existingOrder } : {})
    }).subscribe({
      next: () => {
        this.mutationPending = false;
        this.editModalOpen = false;
        this.selectedCategory = null;
        this.setFeedback('success', 'Master category updated.');
        this.reload();
      },
      error: () => {
        this.mutationPending = false;
        this.setFeedback('error', 'Failed to update master category.');
      }
    });
  }

  openDeleteDialog(category: ProductCategory): void {
    if (this.mutationPending) {
      return;
    }

    this.pendingDeleteCategory = { ...category };
    this.deleteDialogOpen = true;
    this.feedbackMessage = '';
  }

  closeDeleteDialog(): void {
    if (!this.mutationPending) {
      this.deleteDialogOpen = false;
      this.pendingDeleteCategory = null;
    }
  }

  confirmDeleteCategory(): void {
    if (!this.pendingDeleteCategory) {
      return;
    }

    this.mutationPending = true;
    this.categoryService.delete(this.pendingDeleteCategory.id).subscribe({
      next: (deleted) => {
        this.mutationPending = false;
        this.deleteDialogOpen = false;
        this.pendingDeleteCategory = null;
        if (deleted) {
          this.setFeedback('success', 'Master category removed.');
          this.reload();
          return;
        }

        this.setFeedback('error', 'Master category could not be removed.');
      },
      error: () => {
        this.mutationPending = false;
        this.deleteDialogOpen = false;
        this.pendingDeleteCategory = null;
        this.setFeedback('error', 'Failed to remove master category.');
      }
    });
  }

  existingCategoryNames(): string[] {
    return this.categories.map((category) => category.productCategoryName || '').filter((value) => !!value);
  }

  categoryCountLabel(): string {
    const count = this.categories.length;
    return `${count} master ${count === 1 ? 'category' : 'categories'}`;
  }

  deleteDialogMessage(): string {
    if (!this.pendingDeleteCategory) {
      return 'This permanently removes the selected master category.';
    }

    return `This permanently removes "${this.pendingDeleteCategory.productCategoryName}" from the master catalog. Use retirement instead of removal when you still need to keep the record available for audit or future reference.`;
  }

  trackById(_index: number, item: ProductCategory): string {
    return item.id;
  }

  imageLabel(category: ProductCategory): string {
    return category.productCategoryImageURL ? 'Set' : 'Not set';
  }

  statusTone(category: ProductCategory): 'success' | 'muted' {
    return category.visible ? 'success' : 'muted';
  }

  statusLabel(category: ProductCategory): string {
    return category.visible ? 'Active' : 'Retired';
  }

  private getNextCategoryOrder(): number {
    if (this.categories.length === 0) {
      return 0;
    }

    return this.categories.reduce((maxOrder, category) => Math.max(maxOrder, category.order ?? 0), 0) + 1;
  }

  private setFeedback(tone: 'success' | 'error', message: string): void {
    this.feedbackTone = tone;
    this.feedbackMessage = message;
  }
}
