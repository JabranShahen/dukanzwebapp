import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { EventProductMutation, EventProductRecord } from '../../models/event-product.model';
import { Product } from '../../models/product.model';
import { BlobStorageService } from '../../services/blob-storage.service';

@Component({
  selector: 'app-event-product-modal',
  templateUrl: './event-product-modal.component.html',
  styleUrls: ['./event-product-modal.component.scss']
})
export class EventProductModalComponent implements OnChanges, OnDestroy {
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
  priceError = '';
  unitError = '';
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
    productId: ['', [Validators.required]],
    orignalPrice: [0, [Validators.required, Validators.min(0)]],
    currentPrice: [0, [Validators.required, Validators.min(0)]],
    currentCost: [0, [Validators.required, Validators.min(0)]],
    unitName: ['', [Validators.required]],
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
          productId: this.assignment.productId || '',
          orignalPrice: this.assignment.orignalPrice ?? 0,
          currentPrice: this.assignment.currentPrice ?? 0,
          currentCost: this.assignment.currentCost ?? 0,
          unitName: this.assignment.unitName || '',
          visible: this.assignment.visible
        });
      } else {
        this.assignmentForm.reset({
          productId: '',
          orignalPrice: 0,
          currentPrice: 0,
          currentCost: 0,
          unitName: '',
          visible: true
        });
      }

      this.productError = '';
      this.priceError = '';
      this.unitError = '';
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
    this.productError = '';
    this.priceError = '';
    this.unitError = '';
    this.imageError = '';
    this.assignmentForm.markAllAsTouched();

    if (this.assignmentForm.invalid) {
      return;
    }

    const value = this.assignmentForm.getRawValue();
    const productId = this.normalizeText(value.productId);
    const orignalPrice = this.normalizeMoney(value.orignalPrice);
    const currentPrice = this.normalizeMoney(value.currentPrice);
    const currentCost = this.normalizeMoney(value.currentCost);
    const unitName = this.normalizeText(value.unitName);

    if (!productId) {
      this.productError = 'A master product selection is required.';
      return;
    }

    if (this.mode === 'add' && this.existingProductIds.some((existingId) => existingId === productId.toLowerCase())) {
      this.productError = 'This master product is already assigned to the selected event category.';
      return;
    }

    if (!unitName) {
      this.unitError = 'Unit is required.';
      return;
    }

    if (orignalPrice < 0 || currentPrice < 0 || currentCost < 0) {
      this.priceError = 'Prices and cost must be zero or greater.';
      return;
    }

    this.saved.emit({
      ...(this.assignment ? { id: this.assignment.id } : {}),
      productId,
      overrideImageURL: this.removeCurrentImage ? '' : this.currentOverrideImagePath,
      imageFile: this.selectedImageFile,
      clearImage: this.removeCurrentImage,
      orignalPrice,
      currentPrice,
      currentCost,
      unitName,
      visible: !!value.visible,
      order: this.assignment?.order ?? 0
    });
  }

  onProductSelectionChange(): void {
    if (this.mode !== 'add') {
      return;
    }

    const selectedProductId = this.normalizeText(this.assignmentForm.controls.productId.value);
    const selectedProduct = this.availableProducts.find((product) => product.id === selectedProductId);
    if (!selectedProduct) {
      return;
    }

    this.assignmentForm.patchValue({
      orignalPrice: this.normalizeMoney(selectedProduct.orignalPrice),
      currentPrice: this.normalizeMoney(selectedProduct.currentPrice),
      currentCost: this.normalizeMoney(selectedProduct.currentCost),
      unitName: this.normalizeText(selectedProduct.unitName)
    });
    this.loadMasterPreview();
  }

  productLabel(): string {
    if (this.mode !== 'edit' || !this.assignment) {
      return '';
    }

    const matchedProduct = this.availableProducts.find((product) => product.id === this.assignment?.productId);
    return matchedProduct?.productName || this.assignment.productId;
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

    return this.masterImagePreviewUrl ? 'Master product image' : '';
  }

  private normalizeText(value: string): string {
    return (value || '').trim();
  }

  private normalizeMoney(value: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, value);
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

    const productId = this.mode === 'edit' && this.assignment
      ? this.assignment.productId
      : this.assignmentForm.controls.productId.value;
    const selectedProduct = this.availableProducts.find((product) => product.id === this.normalizeText(productId));
    const imagePath = (selectedProduct?.imageURL || '').trim();
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
