import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { ProductCategory, ProductCategoryMutation } from '../../models/product-category.model';

@Component({
  selector: 'app-edit-category-modal',
  templateUrl: './edit-category-modal.component.html',
  styleUrls: ['./edit-category-modal.component.scss']
})
export class EditCategoryModalComponent implements OnChanges {
  @Input() category: ProductCategory | null = null;
  @Input() existingNames: string[] = [];
  @Input() pending = false;
  @Output() cancelled = new EventEmitter<void>();
  @Output() saved = new EventEmitter<ProductCategoryMutation>();

  nameError = '';
  private currentName = '';

  readonly categoryForm = this.formBuilder.nonNullable.group({
    productCategoryName: ['', [Validators.required, Validators.maxLength(80)]],
    productCategoryImageURL: ['', [Validators.maxLength(400)]],
    order: [0, [Validators.required, Validators.min(0)]],
    visible: [true]
  });

  constructor(private readonly formBuilder: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['category'] && this.category) {
      this.currentName = this.category.productCategoryName || '';
      this.categoryForm.reset({
        productCategoryName: this.category.productCategoryName || '',
        productCategoryImageURL: this.category.productCategoryImageURL || '',
        order: Number(this.category.order || 0),
        visible: !!this.category.visible
      });
      this.nameError = '';
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onSubmit(): void {
    if (!this.category) {
      return;
    }

    this.nameError = '';
    this.categoryForm.markAllAsTouched();

    if (this.categoryForm.invalid) {
      return;
    }

    const value = this.categoryForm.getRawValue();
    const normalizedName = this.normalize(value.productCategoryName);

    const duplicateExists = this.existingNames
      .map((name) => this.normalize(name))
      .filter((name) => name !== this.normalize(this.currentName))
      .some((name) => name === normalizedName);

    if (duplicateExists) {
      this.nameError = 'Category name must be unique.';
      return;
    }

    this.saved.emit({
      id: this.category.id,
      productCategoryName: value.productCategoryName.trim(),
      productCategoryImageURL: value.productCategoryImageURL.trim(),
      order: Number(value.order),
      visible: !!value.visible
    });
  }

  private normalize(value: string): string {
    return (value || '').trim().toLowerCase();
  }
}
