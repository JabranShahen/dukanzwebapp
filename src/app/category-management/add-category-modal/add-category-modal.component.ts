import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { ProductCategoryMutation } from '../../models/product-category.model';

@Component({
  selector: 'app-add-category-modal',
  templateUrl: './add-category-modal.component.html',
  styleUrls: ['./add-category-modal.component.scss']
})
export class AddCategoryModalComponent {
  @Input() existingNames: string[] = [];
  @Input() pending = false;
  @Output() cancelled = new EventEmitter<void>();
  @Output() saved = new EventEmitter<ProductCategoryMutation>();

  nameError = '';

  readonly categoryForm = this.formBuilder.nonNullable.group({
    productCategoryName: ['', [Validators.required, Validators.maxLength(80)]],
    productCategoryImageURL: ['', [Validators.maxLength(400)]],
    order: [0, [Validators.required, Validators.min(0)]],
    visible: [true]
  });

  constructor(private readonly formBuilder: FormBuilder) {}

  onCancel(): void {
    this.cancelled.emit();
  }

  onSubmit(): void {
    this.nameError = '';
    this.categoryForm.markAllAsTouched();

    if (this.categoryForm.invalid) {
      return;
    }

    const value = this.categoryForm.getRawValue();
    const normalizedName = this.normalize(value.productCategoryName);

    const duplicateExists = this.existingNames
      .map((name) => this.normalize(name))
      .some((name) => name === normalizedName);

    if (duplicateExists) {
      this.nameError = 'Category name must be unique.';
      return;
    }

    this.saved.emit({
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
