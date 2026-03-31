import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { ProductMutation, createEmptyProductCategory } from '../../models/product.model';

@Component({
  selector: 'app-add-product-modal',
  templateUrl: './add-product-modal.component.html',
  styleUrls: ['./add-product-modal.component.scss']
})
export class AddProductModalComponent {
  @Input() pending = false;
  @Output() cancelled = new EventEmitter<void>();
  @Output() saved = new EventEmitter<ProductMutation>();

  nameError = '';

  readonly productForm = this.formBuilder.nonNullable.group({
    productName: ['', [Validators.required, Validators.maxLength(120)]],
    productDescription: ['', [Validators.maxLength(500)]],
    orignalPrice: [0, [Validators.required, Validators.min(0)]],
    currentPrice: [0, [Validators.required, Validators.min(0)]],
    currentCost: [0, [Validators.required, Validators.min(0)]],
    unitName: ['', [Validators.required, Validators.maxLength(40)]],
    imageURL: ['', [Validators.maxLength(400)]]
  });

  constructor(private readonly formBuilder: FormBuilder) {}

  onCancel(): void {
    this.cancelled.emit();
  }

  onSubmit(): void {
    this.nameError = '';
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
      imageURL: this.normalizeText(value.imageURL),
      visible: true,
      productCategory: createEmptyProductCategory()
    });
  }

  private normalizeText(value: string): string {
    return (value || '').trim();
  }
}
