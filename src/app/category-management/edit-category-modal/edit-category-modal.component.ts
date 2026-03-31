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
  imageError = '';
  selectedImageFile: File | null = null;
  removeCurrentImage = false;
  currentImagePath = '';
  private currentName = '';

  readonly categoryForm = this.formBuilder.nonNullable.group({
    productCategoryName: ['', [Validators.required, Validators.maxLength(80)]],
    visible: [true]
  });

  constructor(private readonly formBuilder: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['category'] && this.category) {
      this.currentName = this.category.productCategoryName || '';
      this.currentImagePath = this.category.productCategoryImageURL || '';
      this.selectedImageFile = null;
      this.removeCurrentImage = false;
      this.categoryForm.reset({
        productCategoryName: this.category.productCategoryName || '',
        visible: !!this.category.visible
      });
      this.nameError = '';
      this.imageError = '';
    }
  }

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
    this.removeCurrentImage = false;
  }

  onSubmit(): void {
    if (!this.category) {
      return;
    }

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
      .filter((name) => name !== this.normalize(this.currentName))
      .some((name) => name === normalizedName);

    if (duplicateExists) {
      this.nameError = 'Master category name must be unique.';
      return;
    }

    this.saved.emit({
      id: this.category.id,
      productCategoryName: value.productCategoryName.trim(),
      productCategoryImageURL: this.removeCurrentImage ? '' : this.currentImagePath,
      imageFile: this.selectedImageFile,
      clearImage: this.removeCurrentImage,
      visible: !!value.visible
    });
  }

  private normalize(value: string): string {
    return (value || '').trim().toLowerCase();
  }
}
