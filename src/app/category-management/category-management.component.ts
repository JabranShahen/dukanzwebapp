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
        this.categories = [...categories].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load categories from ProductCategory endpoint.';
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
    this.categoryService.create(payload).subscribe({
      next: () => {
        this.mutationPending = false;
        this.addModalOpen = false;
        this.setFeedback('success', 'Category created.');
        this.reload();
      },
      error: () => {
        this.mutationPending = false;
        this.setFeedback('error', 'Failed to create category.');
      }
    });
  }

  onEditCategory(payload: ProductCategoryMutation): void {
    this.mutationPending = true;
    this.categoryService.update(payload).subscribe({
      next: () => {
        this.mutationPending = false;
        this.editModalOpen = false;
        this.selectedCategory = null;
        this.setFeedback('success', 'Category updated.');
        this.reload();
      },
      error: () => {
        this.mutationPending = false;
        this.setFeedback('error', 'Failed to update category.');
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
          this.setFeedback('success', 'Category deleted.');
          this.reload();
          return;
        }

        this.setFeedback('error', 'Delete failed.');
      },
      error: () => {
        this.mutationPending = false;
        this.deleteDialogOpen = false;
        this.pendingDeleteCategory = null;
        this.setFeedback('error', 'Failed to delete category.');
      }
    });
  }

  existingCategoryNames(): string[] {
    return this.categories.map((category) => category.productCategoryName || '').filter((value) => !!value);
  }

  deleteDialogMessage(): string {
    if (!this.pendingDeleteCategory) {
      return 'This action cannot be undone.';
    }

    return `This will remove "${this.pendingDeleteCategory.productCategoryName}". This cannot be undone.`;
  }

  trackById(_index: number, item: ProductCategory): string {
    return item.id;
  }

  imageLabel(category: ProductCategory): string {
    return category.productCategoryImageURL ? 'Available' : 'N/A';
  }

  statusTone(category: ProductCategory): 'success' | 'muted' {
    return category.visible ? 'success' : 'muted';
  }

  statusLabel(category: ProductCategory): string {
    return category.visible ? 'Visible' : 'Hidden';
  }

  private setFeedback(tone: 'success' | 'error', message: string): void {
    this.feedbackTone = tone;
    this.feedbackMessage = message;
  }
}
