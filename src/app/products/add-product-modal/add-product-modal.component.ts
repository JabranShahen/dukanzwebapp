import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { ProductMutation, createEmptyProductCategory } from '../../models/product.model';

@Component({
  selector: 'app-add-product-modal',
  templateUrl: './add-product-modal.component.html',
  styleUrls: ['./add-product-modal.component.scss']
})
export class AddProductModalComponent implements OnDestroy {
  @Input() pending = false;
  @Output() cancelled = new EventEmitter<void>();
  @Output() saved = new EventEmitter<ProductMutation>();

  nameError = '';
  imageError = '';
  selectedImageFile: File | null = null;
  selectedImagePreviewUrl = '';

  readonly productForm = this.formBuilder.nonNullable.group({
    productName: ['', [Validators.required, Validators.maxLength(120)]],
    productDescription: ['', [Validators.maxLength(500)]],
    orignalPrice: [0, [Validators.required, Validators.min(0)]],
    currentPrice: [0, [Validators.required, Validators.min(0)]],
    currentCost: [0, [Validators.required, Validators.min(0)]],
    unitName: ['', [Validators.required, Validators.maxLength(40)]]
  });

  constructor(private readonly formBuilder: FormBuilder) {}

  ngOnDestroy(): void {
    this.revokeSelectedImagePreview();
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
      this.revokeSelectedImagePreview();
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.selectedImageFile = null;
      this.revokeSelectedImagePreview();
      this.imageError = 'Select a valid image file.';
      if (input) {
        input.value = '';
      }
      return;
    }

    this.selectedImageFile = file;
    this.revokeSelectedImagePreview();
    this.selectedImagePreviewUrl = URL.createObjectURL(file);
  }

  onSubmit(): void {
    this.nameError = '';
    this.imageError = '';
    this.productForm.markAllAsTouched();

    if (this.productForm.invalid) {
      return;
    }

    const value = this.productForm.getRawValue();
    const normalizedName = this.normalizeText(value.productName);

    if (!normalizedName) {
      this.nameError = 'Master product name is required.';
      return;
    }

    this.saved.emit({
      productName: normalizedName,
      productDescription: this.normalizeText(value.productDescription),
      orignalPrice: Number(value.orignalPrice),
      currentPrice: Number(value.currentPrice),
      currentCost: Number(value.currentCost),
      unitName: this.normalizeText(value.unitName),
      imageURL: '',
      imageFile: this.selectedImageFile,
      visible: true,
      productCategory: createEmptyProductCategory()
    });
  }

  private normalizeText(value: string): string {
    return (value || '').trim();
  }

  private revokeSelectedImagePreview(): void {
    if (this.selectedImagePreviewUrl) {
      URL.revokeObjectURL(this.selectedImagePreviewUrl);
      this.selectedImagePreviewUrl = '';
    }
  }
}
