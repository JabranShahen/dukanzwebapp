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
  imageError = '';
  selectedImageFile: File | null = null;

  readonly categoryForm = this.formBuilder.nonNullable.group({
    productCategoryName: ['', [Validators.required, Validators.maxLength(80)]],
    visible: [true]
  });

  constructor(private readonly formBuilder: FormBuilder) {}

  onCancel(): void {
    this.cancelled.emit();
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0] || null;
    this.imageError = '';

    if (!file) {
      this.selectedImageFile = null;
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.selectedImageFile = null;
      this.imageError = 'Select a valid image file.';
      if (input) {
        input.value = '';
      }
      return;
    }

    this.selectedImageFile = file;
  }

  onSubmit(): void {
    this.nameError = '';
    this.imageError = '';
    this.categoryForm.markAllAsTouched();

    if (this.categoryForm.invalid) {
      return;
    }

    const value = this.categoryForm.getRawValue();
    const normalizedName = this.normalize(value.productCategoryName);

    if (!normalizedName) {
      this.nameError = 'Master category name is required.';
      return;
    }

    const duplicateExists = this.existingNames
      .map((name) => this.normalize(name))
      .some((name) => name === normalizedName);

    if (duplicateExists) {
      this.nameError = 'Master category name must be unique.';
      return;
    }

    this.saved.emit({
      productCategoryName: value.productCategoryName.trim(),
      productCategoryImageURL: '',
      imageFile: this.selectedImageFile,
      visible: !!value.visible
    });
  }

  private normalize(value: string): string {
    return (value || '').trim().toLowerCase();
  }
}
