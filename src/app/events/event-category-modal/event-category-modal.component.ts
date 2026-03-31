import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { EventCategoryMutation, EventCategoryRecord } from '../../models/event-category.model';
import { ProductCategory } from '../../models/product-category.model';

@Component({
  selector: 'app-event-category-modal',
  templateUrl: './event-category-modal.component.html',
  styleUrls: ['./event-category-modal.component.scss']
})
export class EventCategoryModalComponent implements OnChanges {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() eventName = '';
  @Input() assignment: EventCategoryRecord | null = null;
  @Input() availableCategories: ProductCategory[] = [];
  @Input() existingProductCategoryIds: string[] = [];
  @Input() pending = false;

  @Output() cancelled = new EventEmitter<void>();
  @Output() saved = new EventEmitter<EventCategoryMutation>();

  categoryError = '';
  orderError = '';

  readonly assignmentForm = this.formBuilder.nonNullable.group({
    productCategoryId: ['', [Validators.required]],
    visible: [true],
    order: [0, [Validators.required, Validators.min(0)]]
  });

  constructor(private readonly formBuilder: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['assignment'] || changes['availableCategories']) {
      if (this.mode === 'edit' && this.assignment) {
        this.assignmentForm.reset({
          productCategoryId: this.assignment.productCategoryId || '',
          visible: this.assignment.visible,
          order: this.assignment.order ?? 0
        });
      } else {
        this.assignmentForm.reset({
          productCategoryId: '',
          visible: true,
          order: 0
        });
      }

      this.categoryError = '';
      this.orderError = '';
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onSubmit(): void {
    this.categoryError = '';
    this.orderError = '';
    this.assignmentForm.markAllAsTouched();

    if (this.assignmentForm.controls.order.invalid && this.assignmentForm.controls.order.value < 0) {
      this.orderError = 'Order must be zero or greater.';
    }

    if (this.assignmentForm.invalid) {
      return;
    }

    const value = this.assignmentForm.getRawValue();
    const productCategoryId = this.normalizeText(value.productCategoryId);
    const order = this.normalizeOrder(value.order);

    if (!productCategoryId) {
      this.categoryError = 'A master category selection is required.';
      return;
    }

    if (
      this.mode === 'add' &&
      this.existingProductCategoryIds.some((existingId) => existingId === productCategoryId.toLowerCase())
    ) {
      this.categoryError = 'This master category is already assigned to the selected event.';
      return;
    }

    if (order < 0) {
      this.orderError = 'Order must be zero or greater.';
      return;
    }

    this.saved.emit({
      ...(this.assignment ? { id: this.assignment.id } : {}),
      productCategoryId,
      visible: !!value.visible,
      order
    });
  }

  categoryLabel(): string {
    if (this.mode !== 'edit' || !this.assignment) {
      return '';
    }

    const matchedCategory = this.availableCategories.find((category) => category.id === this.assignment?.productCategoryId);
    return matchedCategory?.productCategoryName || this.assignment.productCategoryId;
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
