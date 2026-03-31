import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { EventProductMutation, EventProductRecord } from '../../models/event-product.model';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-event-product-modal',
  templateUrl: './event-product-modal.component.html',
  styleUrls: ['./event-product-modal.component.scss']
})
export class EventProductModalComponent implements OnChanges {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() eventName = '';
  @Input() categoryName = '';
  @Input() assignment: EventProductRecord | null = null;
  @Input() availableProducts: Product[] = [];
  @Input() existingProductIds: string[] = [];
  @Input() pending = false;

  @Output() cancelled = new EventEmitter<void>();
  @Output() saved = new EventEmitter<EventProductMutation>();

  productError = '';

  readonly assignmentForm = this.formBuilder.nonNullable.group({
    productId: ['', [Validators.required]],
    visible: [true]
  });

  constructor(private readonly formBuilder: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['assignment']) {
      if (this.mode === 'edit' && this.assignment) {
        this.assignmentForm.reset({
          productId: this.assignment.productId || '',
          visible: this.assignment.visible
        });
      } else {
        this.assignmentForm.reset({
          productId: '',
          visible: true
        });
      }

      this.productError = '';
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onSubmit(): void {
    this.productError = '';
    this.assignmentForm.markAllAsTouched();

    if (this.assignmentForm.invalid) {
      return;
    }

    const value = this.assignmentForm.getRawValue();
    const productId = this.normalizeText(value.productId);

    if (!productId) {
      this.productError = 'A master product selection is required.';
      return;
    }

    if (this.mode === 'add' && this.existingProductIds.some((existingId) => existingId === productId.toLowerCase())) {
      this.productError = 'This master product is already assigned to the selected event category.';
      return;
    }

    this.saved.emit({
      ...(this.assignment ? { id: this.assignment.id } : {}),
      productId,
      visible: !!value.visible,
      order: this.assignment?.order ?? 0
    });
  }

  productLabel(): string {
    if (this.mode !== 'edit' || !this.assignment) {
      return '';
    }

    const matchedProduct = this.availableProducts.find((product) => product.id === this.assignment?.productId);
    return matchedProduct?.productName || this.assignment.productId;
  }

  private normalizeText(value: string): string {
    return (value || '').trim();
  }
}
