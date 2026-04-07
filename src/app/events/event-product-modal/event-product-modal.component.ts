import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { EventProductMutation, EventProductRecord } from '../../models/event-product.model';
import { Product, ProductMutation } from '../../models/product.model';
import { BlobStorageService } from '../../services/blob-storage.service';
import { ProductService } from '../../services/product.service';

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
  @Input() allMasterProducts: Product[] = [];
  @Input() existingProductIds: string[] = [];
  @Input() pending = false;

  @Output() cancelled = new EventEmitter<void>();
  @Output() saved = new EventEmitter<EventProductMutation>();
  @Output() masterProductCreated = new EventEmitter<Product>();

  productError = '';
  priceError = '';
  unitError = '';
  imageError = '';
  selectedImageFile: File | null = null;
  removeCurrentImage = false;
  addMasterProductOpen = false;
  addMasterProductPending = false;
  currentImagePath = '';
  currentImagePreviewUrl = '';
  selectedImagePreviewUrl = '';
  private currentImageSubscription: Subscription | null = null;

  readonly assignmentForm = this.formBuilder.nonNullable.group({
    productId: ['', [Validators.required]],
    productName: ['', [Validators.required, Validators.maxLength(120)]],
    productDescription: [''],
    displayPercentage: [0, [Validators.min(0)]],
    displayUnitName: [''],
    orignalPrice: [0, [Validators.required, Validators.min(0)]],
    currentPrice: [0, [Validators.required, Validators.min(0)]],
    currentCost: [0, [Validators.required, Validators.min(0)]],
    unitName: ['', [Validators.required]],
    imagePublicUrl: ['', [Validators.maxLength(2048)]],
    visible: [true]
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly blobStorageService: BlobStorageService,
    private readonly productService: ProductService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['assignment']) {
      if (this.mode === 'edit' && this.assignment) {
        this.assignmentForm.reset({
          productId: this.assignment.productId || '',
          productName: this.assignment.productName || '',
          productDescription: this.assignment.productDescription || '',
          displayPercentage: this.assignment.displayPercentage ?? 0,
          displayUnitName: this.assignment.displayUnitName || '',
          orignalPrice: this.assignment.orignalPrice ?? 0,
          currentPrice: this.assignment.currentPrice ?? 0,
          currentCost: this.assignment.currentCost ?? 0,
          unitName: this.assignment.unitName || '',
          imagePublicUrl: this.assignment.imagePublicUrl || '',
          visible: this.assignment.visible
        });
      } else {
        this.assignmentForm.reset({
          productId: '',
          productName: '',
          productDescription: '',
          displayPercentage: 0,
          displayUnitName: '',
          orignalPrice: 0,
          currentPrice: 0,
          currentCost: 0,
          imagePublicUrl: '',
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
      this.currentImagePath = this.assignment?.imageURL || '';
      this.revokeSelectedImagePreview();
      this.loadCurrentImagePreview();
    }
  }

  ngOnDestroy(): void {
    this.currentImageSubscription?.unsubscribe();
    this.revokeSelectedImagePreview();
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  openAddMasterProduct(): void {
    this.addMasterProductOpen = true;
  }

  closeAddMasterProduct(): void {
    if (!this.addMasterProductPending) {
      this.addMasterProductOpen = false;
    }
  }

  onMasterProductSaved(payload: ProductMutation): void {
    this.addMasterProductPending = true;

    const imageUpload$ = payload.imageFile
      ? this.blobStorageService.uploadImage(payload.imageFile, 'dukanz/products')
      : of('');

    imageUpload$.pipe(
      switchMap((imageURL) => this.productService.create({ ...payload, imageURL }))
    ).subscribe({
      next: (created) => {
        this.addMasterProductPending = false;
        this.addMasterProductOpen = false;
        this.masterProductCreated.emit(created);
        this.assignmentForm.controls.productId.setValue(created.id);
        this.assignmentForm.patchValue({
          productName: created.productName || '',
          productDescription: created.productDescription || '',
          displayPercentage: this.normalizeMoney(created.displayPercentage),
          displayUnitName: created.displayUnitName || '',
          orignalPrice: created.orignalPrice ?? 0,
          currentPrice: created.currentPrice ?? 0,
          currentCost: created.currentCost ?? 0,
          unitName: created.unitName || '',
          imagePublicUrl: created.imagePublicUrl || ''
        });
        this.currentImagePath = (created.imageURL || '').trim();
        this.loadCurrentImagePreview();
      },
      error: () => {
        this.addMasterProductPending = false;
      }
    });
  }

  existingMasterProductNames(): string[] {
    return this.allMasterProducts.map((p) => (p.productName || '').trim().toLowerCase());
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
    const productName = this.normalizeText(value.productName);
    const productDescription = this.normalizeText(value.productDescription);
    const displayUnitName = this.normalizeText(value.displayUnitName);
    const displayPercentage = this.normalizeMoney(value.displayPercentage);
    const orignalPrice = this.normalizeMoney(value.orignalPrice);
    const currentPrice = this.normalizeMoney(value.currentPrice);
    const currentCost = this.normalizeMoney(value.currentCost);
    const unitName = this.normalizeText(value.unitName);
    const imagePublicUrl = this.normalizeText(value.imagePublicUrl);

    if (!productId) {
      this.productError = 'A master product selection is required.';
      return;
    }

    if (this.mode === 'add' && this.existingProductIds.some((existingId) => existingId === productId.toLowerCase())) {
      this.productError = 'This master product is already assigned to the selected event category.';
      return;
    }

    if (!productName) {
      this.productError = 'Product name is required.';
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

    if (imagePublicUrl && !this.isValidPublicUrl(imagePublicUrl)) {
      this.imageError = 'Enter a valid public image URL.';
      return;
    }

    this.saved.emit({
      ...(this.assignment ? { id: this.assignment.id } : {}),
      productId,
      productName,
      productDescription,
      imageURL: this.removeCurrentImage ? '' : this.currentImagePath,
      imagePublicUrl,
      imageFile: this.selectedImageFile,
      clearImage: this.removeCurrentImage,
      displayPercentage,
      displayUnitName,
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
      productName: selectedProduct.productName || '',
      productDescription: selectedProduct.productDescription || '',
      displayPercentage: this.normalizeMoney(selectedProduct.displayPercentage),
      displayUnitName: selectedProduct.displayUnitName || '',
      orignalPrice: this.normalizeMoney(selectedProduct.orignalPrice),
      currentPrice: this.normalizeMoney(selectedProduct.currentPrice),
      currentCost: this.normalizeMoney(selectedProduct.currentCost),
      unitName: this.normalizeText(selectedProduct.unitName),
      imagePublicUrl: selectedProduct.imagePublicUrl || ''
    });

    this.currentImagePath = (selectedProduct.imageURL || '').trim();
    this.seedMasterImagePreview(selectedProduct);
  }

  productLabel(): string {
    if (this.mode !== 'edit' || !this.assignment) {
      return '';
    }
    return this.assignment.productName || this.assignment.productId;
  }

  previewImageUrl(): string {
    if (this.selectedImagePreviewUrl) {
      return this.selectedImagePreviewUrl;
    }

    const publicUrl = this.normalizeText(this.assignmentForm.controls.imagePublicUrl.value);
    if (publicUrl && this.isValidPublicUrl(publicUrl)) {
      return publicUrl;
    }

    if (!this.removeCurrentImage && this.currentImagePreviewUrl) {
      return this.currentImagePreviewUrl;
    }
    return '';
  }

  previewLabel(): string {
    if (this.selectedImagePreviewUrl) {
      return 'Selected image';
    }
    const publicUrl = this.normalizeText(this.assignmentForm.controls.imagePublicUrl.value);
    if (publicUrl && this.isValidPublicUrl(publicUrl)) {
      return 'Public image';
    }
    if (!this.removeCurrentImage && this.currentImagePreviewUrl) {
      return 'Current image';
    }
    return '';
  }

  private normalizeText(value: string): string {
    return (value || '').trim();
  }

  private normalizeMoney(value: number | undefined): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 0;
    }
    return Math.max(0, value);
  }

  private isValidPublicUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private loadCurrentImagePreview(): void {
    this.currentImagePreviewUrl = '';
    this.currentImageSubscription?.unsubscribe();

    const imagePath = (this.currentImagePath || '').trim();
    if (!imagePath) {
      return;
    }

    this.currentImageSubscription = this.blobStorageService.getDownloadUrl(imagePath).subscribe({
      next: (imageUrl) => { this.currentImagePreviewUrl = imageUrl || ''; },
      error: () => { this.currentImagePreviewUrl = ''; }
    });
  }

  private seedMasterImagePreview(product: Product): void {
    const publicUrl = this.normalizeText(product.imagePublicUrl || '');
    if (publicUrl && this.isValidPublicUrl(publicUrl)) {
      this.currentImagePreviewUrl = publicUrl;
      return;
    }

    const imagePath = (product.imageURL || '').trim();
    if (!imagePath) {
      return;
    }
    this.blobStorageService.getDownloadUrl(imagePath).subscribe({
      next: (imageUrl) => { this.currentImagePreviewUrl = imageUrl || ''; },
      error: () => {}
    });
  }

  private revokeSelectedImagePreview(): void {
    if (this.selectedImagePreviewUrl) {
      URL.revokeObjectURL(this.selectedImagePreviewUrl);
      this.selectedImagePreviewUrl = '';
    }
  }
}
