import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

import { Product, ProductMutation, createEmptyProductCategory } from '../../models/product.model';
import { BlobStorageService } from '../../services/blob-storage.service';

@Component({
  selector: 'app-edit-product-modal',
  templateUrl: './edit-product-modal.component.html',
  styleUrls: ['./edit-product-modal.component.scss']
})
export class EditProductModalComponent implements OnChanges, OnDestroy {
  @Input() product: Product | null = null;
  @Input() pending = false;
  @Output() cancelled = new EventEmitter<void>();
  @Output() saved = new EventEmitter<ProductMutation>();

  nameError = '';
  imageError = '';
  selectedImageFile: File | null = null;
  removeCurrentImage = false;
  currentImagePath = '';
  storedImagePreviewUrl = '';
  selectedImagePreviewUrl = '';
  private imagePreviewSubscription: Subscription | null = null;

  readonly productForm = this.formBuilder.nonNullable.group({
    productName: ['', [Validators.required, Validators.maxLength(120)]],
    productDescription: ['', [Validators.maxLength(500)]],
    orignalPrice: [0, [Validators.required, Validators.min(0)]],
    currentPrice: [0, [Validators.required, Validators.min(0)]],
    currentCost: [0, [Validators.required, Validators.min(0)]],
    unitName: ['', [Validators.required, Validators.maxLength(40)]],
    imagePublicUrl: ['', [Validators.maxLength(2048)]]
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly blobStorageService: BlobStorageService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['product'] && this.product) {
      this.currentImagePath = this.product.imageURL || '';
      this.selectedImageFile = null;
      this.removeCurrentImage = false;
      this.revokeSelectedImagePreview();
      this.loadCurrentImagePreview();
      this.productForm.reset({
        productName: this.product.productName || '',
        productDescription: this.product.productDescription || '',
        orignalPrice: this.product.orignalPrice ?? 0,
        currentPrice: this.product.currentPrice ?? 0,
        currentCost: this.product.currentCost ?? 0,
        unitName: this.product.unitName || '',
        imagePublicUrl: this.product.imagePublicUrl || ''
      });
      this.nameError = '';
      this.imageError = '';
    }
  }

  ngOnDestroy(): void {
    this.imagePreviewSubscription?.unsubscribe();
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

  onSubmit(): void {
    if (!this.product) {
      return;
    }

    this.nameError = '';
    this.imageError = '';
    this.productForm.markAllAsTouched();

    if (this.productForm.invalid) {
      return;
    }

    const value = this.productForm.getRawValue();
    const normalizedName = this.normalizeText(value.productName);
    const imagePublicUrl = this.normalizeText(value.imagePublicUrl);

    if (!normalizedName) {
      this.nameError = 'Master product name is required.';
      return;
    }

    if (imagePublicUrl && !this.isValidPublicUrl(imagePublicUrl)) {
      this.imageError = 'Enter a valid public image URL.';
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
      imageURL: this.removeCurrentImage ? '' : this.currentImagePath,
      imagePublicUrl,
      imageFile: this.selectedImageFile,
      clearImage: this.removeCurrentImage,
      visible: this.product.visible ?? true,
      productCategory: this.product.productCategory || createEmptyProductCategory()
    });
  }

  private normalizeText(value: string): string {
    return (value || '').trim();
  }

  private loadCurrentImagePreview(): void {
    this.storedImagePreviewUrl = '';
    this.imagePreviewSubscription?.unsubscribe();

    const imagePath = (this.currentImagePath || '').trim();
    if (!imagePath) {
      return;
    }

    this.imagePreviewSubscription = this.blobStorageService.getDownloadUrl(imagePath).subscribe({
      next: (imageUrl) => {
        this.storedImagePreviewUrl = imageUrl || '';
      },
      error: () => {
        this.storedImagePreviewUrl = '';
      }
    });
  }

  previewImageUrl(): string {
    if (this.selectedImagePreviewUrl) {
      return this.selectedImagePreviewUrl;
    }

    const publicUrl = this.normalizeText(this.productForm.controls.imagePublicUrl.value);
    if (publicUrl && this.isValidPublicUrl(publicUrl)) {
      return publicUrl;
    }

    if (!this.removeCurrentImage) {
      return this.storedImagePreviewUrl;
    }

    return '';
  }

  previewLabel(): string {
    if (this.selectedImagePreviewUrl) {
      return 'Selected image';
    }

    const publicUrl = this.normalizeText(this.productForm.controls.imagePublicUrl.value);
    if (publicUrl && this.isValidPublicUrl(publicUrl)) {
      return 'Public image';
    }

    if (!this.removeCurrentImage && this.storedImagePreviewUrl) {
      return 'Stored image';
    }

    return '';
  }

  get currentImagePreviewUrl(): string {
    return this.storedImagePreviewUrl;
  }

  private isValidPublicUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private revokeSelectedImagePreview(): void {
    if (this.selectedImagePreviewUrl) {
      URL.revokeObjectURL(this.selectedImagePreviewUrl);
      this.selectedImagePreviewUrl = '';
    }
  }
}
