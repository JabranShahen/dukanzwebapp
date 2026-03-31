import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { Product, ProductMutation, createEmptyProductCategory } from '../../models/product.model';

@Component({
  selector: 'app-edit-product-modal',
  templateUrl: './edit-product-modal.component.html',
  styleUrls: ['./edit-product-modal.component.scss']
})
export class EditProductModalComponent implements OnChanges {
  @Input() product: Product | null = null;
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && this.product) {
      this.productForm.reset({
        productName: this.product.productName || '',
        productDescription: this.product.productDescription || '',
        orignalPrice: this.product.orignalPrice ?? 0,
        currentPrice: this.product.currentPrice ?? 0,
        currentCost: this.product.currentCost ?? 0,
        unitName: this.product.unitName || '',
        imageURL: this.product.imageURL || ''
      });
      this.nameError = '';
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onSubmit(): void {
    if (!this.product) {
      return;
    }

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
      id: this.product.id,
      productName: normalizedName,
      productDescription: this.normalizeText(value.productDescription),
      orignalPrice: Number(value.orignalPrice),
      currentPrice: Number(value.currentPrice),
      currentCost: Number(value.currentCost),
      unitName: this.normalizeText(value.unitName),
      imageURL: this.normalizeText(value.imageURL),
      visible: this.product.visible ?? true,
      productCategory: this.product.productCategory || createEmptyProductCategory()
    });
  }

  private normalizeText(value: string): string {
    return (value || '').trim();
  }
}
