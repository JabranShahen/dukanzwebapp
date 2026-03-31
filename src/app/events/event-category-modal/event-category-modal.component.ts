import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { EventCategoryMutation, EventCategoryRecord } from '../../models/event-category.model';
import { ProductCategory } from '../../models/product-category.model';
import { BlobStorageService } from '../../services/blob-storage.service';

@Component({
  selector: 'app-event-category-modal',
  templateUrl: './event-category-modal.component.html',
  styleUrls: ['./event-category-modal.component.scss']
})
export class EventCategoryModalComponent implements OnChanges, OnDestroy {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() eventName = '';
  @Input() assignment: EventCategoryRecord | null = null;
  @Input() availableCategories: ProductCategory[] = [];
  @Input() existingProductCategoryIds: string[] = [];
  @Input() pending = false;

  @Output() cancelled = new EventEmitter<void>();
  @Output() saved = new EventEmitter<EventCategoryMutation>();

  categoryError = '';
  imageError = '';
  selectedImageFile: File | null = null;
  removeCurrentImage = false;
  currentOverrideImagePath = '';
  currentOverridePreviewUrl = '';
  masterImagePreviewUrl = '';
  selectedImagePreviewUrl = '';
  private currentOverrideImageSubscription: Subscription | null = null;
  private masterImageSubscription: Subscription | null = null;

  readonly assignmentForm = this.formBuilder.nonNullable.group({
    productCategoryId: ['', [Validators.required]],
    visible: [true]
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly blobStorageService: BlobStorageService
  ) {}

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
      this.imageError = '';
      this.selectedImageFile = null;
      this.removeCurrentImage = false;
      this.currentOverrideImagePath = this.assignment?.overrideImageURL || '';
      this.revokeSelectedImagePreview();
      this.loadCurrentOverridePreview();
      this.loadMasterPreview();
    }
  }

  ngOnDestroy(): void {
    this.currentOverrideImageSubscription?.unsubscribe();
    this.masterImageSubscription?.unsubscribe();
    this.revokeSelectedImagePreview();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onCategorySelectionChange(): void {
    this.loadMasterPreview();
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
    this.removeCurrentImage = false;
    this.revokeSelectedImagePreview();
    this.selectedImagePreviewUrl = URL.createObjectURL(file);
  }

  onRemoveCurrentImageChange(event: Event): void {
    this.removeCurrentImage = (event.target as HTMLInputElement | null)?.checked ?? false;
  }

  onSubmit(): void {
    this.categoryError = '';
    this.imageError = '';
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
      overrideImageURL: this.removeCurrentImage ? '' : this.currentOverrideImagePath,
      imageFile: this.selectedImageFile,
      clearImage: this.removeCurrentImage,
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

  previewImageUrl(): string {
    if (this.selectedImagePreviewUrl) {
      return this.selectedImagePreviewUrl;
    }

    if (!this.removeCurrentImage && this.currentOverridePreviewUrl) {
      return this.currentOverridePreviewUrl;
    }

    return this.masterImagePreviewUrl;
  }

  previewLabel(): string {
    if (this.selectedImagePreviewUrl) {
      return 'Selected override image';
    }

    if (!this.removeCurrentImage && this.currentOverridePreviewUrl) {
      return 'Current override image';
    }

    return this.masterImagePreviewUrl ? 'Master category image' : '';
  }

  private normalizeText(value: string): string {
    return (value || '').trim();
  }

  private loadCurrentOverridePreview(): void {
    this.currentOverridePreviewUrl = '';
    this.currentOverrideImageSubscription?.unsubscribe();

    const imagePath = (this.currentOverrideImagePath || '').trim();
    if (!imagePath) {
      return;
    }

    this.currentOverrideImageSubscription = this.blobStorageService.getDownloadUrl(imagePath).subscribe({
      next: (imageUrl) => {
        this.currentOverridePreviewUrl = imageUrl || '';
      },
      error: () => {
        this.currentOverridePreviewUrl = '';
      }
    });
  }

  private loadMasterPreview(): void {
    this.masterImagePreviewUrl = '';
    this.masterImageSubscription?.unsubscribe();

    const categoryId = this.mode === 'edit' && this.assignment
      ? this.assignment.productCategoryId
      : this.assignmentForm.controls.productCategoryId.value;
    const selectedCategory = this.availableCategories.find((category) => category.id === this.normalizeText(categoryId));
    const imagePath = (selectedCategory?.productCategoryImageURL || '').trim();
    if (!imagePath) {
      return;
    }

    this.masterImageSubscription = this.blobStorageService.getDownloadUrl(imagePath).subscribe({
      next: (imageUrl) => {
        this.masterImagePreviewUrl = imageUrl || '';
      },
      error: () => {
        this.masterImagePreviewUrl = '';
      }
    });
  }

  private revokeSelectedImagePreview(): void {
    if (this.selectedImagePreviewUrl) {
      URL.revokeObjectURL(this.selectedImagePreviewUrl);
      this.selectedImagePreviewUrl = '';
    }
  }
}
