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

  readonly assignmentForm = this.formBuilder.nonNullable.group({
    productCategoryId: ['', [Validators.required]],
    visible: [true]
  });

  constructor(private readonly formBuilder: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['assignment']) {
      if (this.mode === 'edit' && this.assignment) {
        this.assignmentForm.reset({
          productCategoryId: this.assignment.productCategoryId || '',
          visible: this.assignment.visible
        });
      } else {
        this.assignmentForm.reset({
          productCategoryId: '',
          visible: true
        });
      }

      this.categoryError = '';
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onSubmit(): void {
    this.categoryError = '';
    this.assignmentForm.markAllAsTouched();

    if (this.assignmentForm.invalid) {
      return;
    }

    const value = this.assignmentForm.getRawValue();
    const productCategoryId = this.normalizeText(value.productCategoryId);

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

    this.saved.emit({
      ...(this.assignment ? { id: this.assignment.id } : {}),
      productCategoryId,
      visible: !!value.visible,
      order: this.assignment?.order ?? 0
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
}
