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
  orderError = '';

  readonly assignmentForm = this.formBuilder.nonNullable.group({
    productId: ['', [Validators.required]],
    visible: [true],
    order: [0, [Validators.required, Validators.min(0)]]
  });

  constructor(private readonly formBuilder: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['assignment']) {
      if (this.mode === 'edit' && this.assignment) {
        this.assignmentForm.reset({
          productId: this.assignment.productId || '',
          visible: this.assignment.visible,
          order: this.assignment.order ?? 0
        });
      } else {
        this.assignmentForm.reset({
          productId: '',
          visible: true,
          order: 0
        });
      }

      this.productError = '';
      this.orderError = '';
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onSubmit(): void {
    this.productError = '';
    this.orderError = '';
    this.assignmentForm.markAllAsTouched();

    if (this.assignmentForm.controls.order.invalid && this.assignmentForm.controls.order.value < 0) {
      this.orderError = 'Order must be zero or greater.';
    }

    if (this.assignmentForm.invalid) {
      return;
    }

    const value = this.assignmentForm.getRawValue();
    const productId = this.normalizeText(value.productId);
    const order = this.normalizeOrder(value.order);

    if (!productId) {
      this.productError = 'A master product selection is required.';
      return;
    }

    if (this.mode === 'add' && this.existingProductIds.some((existingId) => existingId === productId.toLowerCase())) {
      this.productError = 'This master product is already assigned to the selected event category.';
      return;
    }

    if (order < 0) {
      this.orderError = 'Order must be zero or greater.';
      return;
    }

    this.saved.emit({
      ...(this.assignment ? { id: this.assignment.id } : {}),
      productId,
      visible: !!value.visible,
      order
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

  private normalizeOrder(value: number): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return 0;
    }

    return Math.trunc(value);
  }
}
