import { AsyncPipe, CommonModule, CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, finalize, timeout } from 'rxjs';

import { ProductCategory } from '../entities/product-category';
import { Product, UpdateProductRequest } from '../entities/product';
import { DukanzProductService } from '../services/dukanz-product.service';
import { ProductCategoryService } from '../services/product-category.service';
import { ManagementHeaderComponent } from '../shared/management-header/management-header.component';
import { ManagementPanelComponent } from '../shared/management-panel/management-panel.component';
import { UiButtonComponent } from '../shared/ui/ui-button/ui-button.component';
import { UiConfirmDialogComponent } from '../shared/ui/ui-confirm-dialog/ui-confirm-dialog.component';
import { UiCountBadgeComponent } from '../shared/ui/ui-count-badge/ui-count-badge.component';
import { UiEmptyStateComponent } from '../shared/ui/ui-empty-state/ui-empty-state.component';
import { UiFeedbackComponent } from '../shared/ui/ui-feedback/ui-feedback.component';
import { UiIconButtonComponent } from '../shared/ui/ui-icon-button/ui-icon-button.component';
import { UiModalComponent } from '../shared/ui/ui-modal/ui-modal.component';
import { UiSkeletonComponent } from '../shared/ui/ui-skeleton/ui-skeleton.component';
import { UiStatusPillComponent } from '../shared/ui/ui-status-pill/ui-status-pill.component';
import { UiTableComponent } from '../shared/ui/ui-table/ui-table.component';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    CurrencyPipe,
    ReactiveFormsModule,
    ManagementHeaderComponent,
    ManagementPanelComponent,
    UiButtonComponent,
    UiConfirmDialogComponent,
    UiCountBadgeComponent,
    UiEmptyStateComponent,
    UiFeedbackComponent,
    UiIconButtonComponent,
    UiModalComponent,
    UiSkeletonComponent,
    UiStatusPillComponent,
    UiTableComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page" *ngIf="state$ | async as state">
      <app-management-header
        eyebrow="DukanzProduct"
        title="Product management"
        subtext="Products now support create, edit, clone, and delete with category assignment and strict field validation."
        ctaLabel="Create product"
        ctaVariant="primary"
        (ctaClick)="openCreateProduct()"
      ></app-management-header>

      <app-management-panel title="Inventory" description="CRUD actions stay in service seams with confirmation and mutation feedback.">
        <div panel-actions class="panel-actions">
          <app-ui-count-badge [count]="state.data.length" label="products"></app-ui-count-badge>
          <app-ui-button variant="secondary" (clicked)="refresh()">Refresh</app-ui-button>
        </div>

        <app-ui-feedback *ngIf="feedbackMessage" [tone]="feedbackTone" [message]="feedbackMessage"></app-ui-feedback>

        <ng-container [ngSwitch]="state.status">
          <app-ui-skeleton *ngSwitchCase="'loading'" [rows]="6" height="1.15rem"></app-ui-skeleton>

          <div *ngSwitchCase="'empty'" class="empty-shell">
            <app-ui-empty-state
              icon="PD"
              title="No products available"
              body="Create your first product and assign it to a category."
              ctaLabel="Create product"
              (ctaClick)="openCreateProduct()"
            ></app-ui-empty-state>
            <app-ui-button variant="ghost" (clicked)="refresh()">Retry fetch</app-ui-button>
          </div>

          <app-ui-empty-state
            *ngSwitchCase="'error'"
            icon="ER"
            title="Product endpoint needs review"
            [body]="state.error || 'The DukanzProduct service is present, but the endpoint response could not be processed.'"
            ctaLabel="Retry"
            (ctaClick)="refresh()"
          ></app-ui-empty-state>

          <app-ui-table *ngSwitchCase="'ready'">
            <table class="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Sell price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let product of state.data; trackBy: trackById">
                  <td>
                    <strong>{{ product.productName }}</strong>
                    <span>{{ product.unitName }}</span>
                  </td>
                  <td>{{ categoryName(product) }}</td>
                  <td>{{ product.currentPrice | currency: 'USD' : 'symbol' : '1.2-2' }}</td>
                  <td>
                    <app-ui-status-pill
                      [label]="product.visible ? 'Visible' : 'Hidden'"
                      [tone]="product.visible ? 'success' : 'warning'"
                    ></app-ui-status-pill>
                  </td>
                  <td class="actions">
                    <app-ui-icon-button icon="ED" label="Edit" (clicked)="openEditProduct(product)"></app-ui-icon-button>
                    <app-ui-icon-button icon="CP" label="Clone" (clicked)="openCloneProduct(product)"></app-ui-icon-button>
                    <app-ui-icon-button
                      icon="RM"
                      label="Delete"
                      variant="danger"
                      (clicked)="requestDeleteProduct(product)"
                    ></app-ui-icon-button>
                  </td>
                </tr>
              </tbody>
            </table>
          </app-ui-table>
        </ng-container>
      </app-management-panel>
    </div>

    <app-ui-modal
      *ngIf="dialogMode"
      [title]="dialogTitle"
      [description]="'Submit is disabled until required fields and numeric rules are valid.'"
      (closeRequested)="closeDialog()"
    >
      <form [formGroup]="productForm" class="form-grid" (ngSubmit)="submitProduct()">
        <label>
          Product name
          <input type="text" formControlName="productName" placeholder="Arabica Beans" />
        </label>
        <p class="error" *ngIf="fieldTouched('productName') && productForm.controls.productName.hasError('required')">
          Product name is required.
        </p>

        <label>
          Product description
          <textarea formControlName="productDescription" rows="3" placeholder="Optional description"></textarea>
        </label>

        <label>
          Category
          <select formControlName="productCategoryId">
            <option value="">Select category</option>
            <option *ngFor="let category of categories" [value]="category.id">{{ category.productCategoryName }}</option>
          </select>
        </label>
        <p class="error" *ngIf="fieldTouched('productCategoryId') && productForm.controls.productCategoryId.hasError('required')">
          Category is required.
        </p>

        <div class="number-grid">
          <label>
            Original price
            <input type="number" formControlName="orignalPrice" min="0" step="0.01" />
          </label>
          <label>
            Current price
            <input type="number" formControlName="currentPrice" min="0" step="0.01" />
          </label>
          <label>
            Current cost
            <input type="number" formControlName="currentCost" min="0" step="0.01" />
          </label>
          <label>
            Display percentage
            <input type="number" formControlName="displayPercentage" min="0" step="0.01" />
          </label>
          <label>
            Order
            <input type="number" formControlName="order" min="0" step="1" />
          </label>
        </div>
        <p class="error" *ngIf="showNumericError">Numeric fields must be 0 or higher.</p>

        <label>
          Unit name
          <input type="text" formControlName="unitName" placeholder="bag" />
        </label>
        <p class="error" *ngIf="fieldTouched('unitName') && productForm.controls.unitName.hasError('required')">Unit name is required.</p>

        <label>
          Display unit name
          <input type="text" formControlName="displayUnitName" placeholder="Optional" />
        </label>

        <label>
          Image URL
          <input type="text" formControlName="imageURL" placeholder="https://..." />
        </label>

        <label class="checkbox-row">
          <input type="checkbox" formControlName="visible" />
          Visible in storefront
        </label>

        <div modal-actions>
          <app-ui-button variant="ghost" (clicked)="closeDialog()">Cancel</app-ui-button>
          <app-ui-button type="button" [disabled]="productForm.invalid || saving" (clicked)="submitProduct()">
            {{ saving ? 'Saving...' : dialogMode === 'create' ? 'Create product' : 'Save changes' }}
          </app-ui-button>
        </div>
      </form>
    </app-ui-modal>

    <app-ui-confirm-dialog
      *ngIf="pendingDelete"
      title="Delete product"
      [message]="'Delete ' + pendingDelete.productName + '? This action cannot be undone.'"
      confirmLabel="Delete"
      confirmVariant="danger"
      (cancel)="pendingDelete = null"
      (confirm)="deleteProduct()"
    ></app-ui-confirm-dialog>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 1.5rem;
      }

      .panel-actions {
        display: flex;
        gap: 0.6rem;
        align-items: center;
        flex-wrap: wrap;
      }

      .empty-shell {
        display: grid;
        gap: 0.8rem;
      }

      .table {
        width: 100%;
        border-collapse: collapse;
      }

      th,
      td {
        padding: 1rem;
        border-bottom: 1px solid rgba(20, 50, 46, 0.08);
        text-align: left;
      }

      td span {
        display: block;
        margin-top: 0.25rem;
        color: var(--tone-muted);
        font-size: 0.85rem;
      }

      .actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .form-grid {
        display: grid;
        gap: 0.75rem;
      }

      .number-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
      }

      label {
        display: grid;
        gap: 0.35rem;
        font-weight: 600;
      }

      input[type='text'],
      input[type='number'],
      textarea,
      select {
        border: 1px solid rgba(20, 50, 46, 0.18);
        border-radius: 12px;
        padding: 0.65rem 0.75rem;
      }

      .checkbox-row {
        grid-auto-flow: column;
        justify-content: start;
        align-items: center;
        gap: 0.55rem;
      }

      .error {
        margin: -0.35rem 0 0;
        color: #8f2e2b;
        font-size: 0.85rem;
      }

      @media (max-width: 900px) {
        .number-grid {
          grid-template-columns: 1fr;
        }

        th,
        td {
          padding: 0.75rem;
        }
      }
    `,
  ],
})
export class ProductManagementComponent implements OnInit, OnDestroy {
  private readonly mutationTimeoutMs = 20000;
  readonly state$;

  categories: ProductCategory[] = [];
  dialogMode: 'create' | 'edit' | null = null;
  dialogTitle = 'Create product';
  editingProductId: string | null = null;
  pendingDelete: Product | null = null;
  saving = false;
  feedbackMessage = '';
  feedbackTone: 'info' | 'success' | 'error' = 'info';

  private readonly subscriptions = new Subscription();

  readonly productForm;

  constructor(
    private readonly productService: DukanzProductService,
    private readonly categoryService: ProductCategoryService,
    private readonly formBuilder: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.state$ = this.productService.state$;
    this.productForm = this.formBuilder.nonNullable.group({
      productName: ['', [Validators.required, Validators.maxLength(160)]],
      productDescription: [''],
      productCategoryId: ['', [Validators.required]],
      orignalPrice: [0, [Validators.required, Validators.min(0)]],
      currentPrice: [0, [Validators.required, Validators.min(0)]],
      currentCost: [0, [Validators.required, Validators.min(0)]],
      unitName: ['', [Validators.required, Validators.maxLength(50)]],
      displayPercentage: [0, [Validators.required, Validators.min(0)]],
      displayUnitName: [''],
      imageURL: [''],
      visible: [true],
      order: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.productService.load();
    this.categoryService.load();

    this.subscriptions.add(
      this.categoryService.state$.subscribe((state) => {
        this.categories = state.data;
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  refresh(): void {
    this.productService.load(true);
    this.categoryService.load(true);
  }

  openCreateProduct(): void {
    this.feedbackMessage = '';
    this.dialogMode = 'create';
    this.dialogTitle = 'Create product';
    this.editingProductId = null;
    this.productForm.reset({
      productName: '',
      productDescription: '',
      productCategoryId: this.categories[0]?.id ?? '',
      orignalPrice: 0,
      currentPrice: 0,
      currentCost: 0,
      unitName: '',
      displayPercentage: 0,
      displayUnitName: '',
      imageURL: '',
      visible: true,
      order: this.productService.getSnapshot().data.length,
    });
  }

  openEditProduct(product: Product): void {
    this.feedbackMessage = '';
    this.dialogMode = 'edit';
    this.dialogTitle = 'Edit product';
    this.editingProductId = product.id;
    this.productForm.reset({
      productName: product.productName,
      productDescription: product.productDescription || '',
      productCategoryId: this.resolveCategoryId(product),
      orignalPrice: product.orignalPrice,
      currentPrice: product.currentPrice,
      currentCost: product.currentCost,
      unitName: product.unitName,
      displayPercentage: product.displayPercentage,
      displayUnitName: product.displayUnitName || '',
      imageURL: product.imageURL || '',
      visible: product.visible,
      order: product.order,
    });
  }

  openCloneProduct(product: Product): void {
    this.feedbackMessage = '';
    this.dialogMode = 'create';
    this.dialogTitle = 'Clone product';
    this.editingProductId = null;
    this.productForm.reset({
      productName: `${product.productName} (Copy)`,
      productDescription: product.productDescription || '',
      productCategoryId: this.resolveCategoryId(product),
      orignalPrice: product.orignalPrice,
      currentPrice: product.currentPrice,
      currentCost: product.currentCost,
      unitName: product.unitName,
      displayPercentage: product.displayPercentage,
      displayUnitName: product.displayUnitName || '',
      imageURL: product.imageURL || '',
      visible: product.visible,
      order: product.order,
    });
  }

  closeDialog(): void {
    this.dialogMode = null;
    this.editingProductId = null;
  }

  requestDeleteProduct(product: Product): void {
    this.pendingDelete = product;
  }

  deleteProduct(): void {
    const product = this.pendingDelete;
    if (!product) {
      return;
    }

    this.pendingDelete = null;
    this.productService.delete(product.id).subscribe({
      next: () => {
        this.setFeedback('success', `Product \"${product.productName}\" deleted.`);
        this.productService.load(true);
      },
      error: (error: unknown) => {
        this.setFeedback('error', this.getMutationErrorMessage(error));
      },
    });
  }

  submitProduct(): void {
    this.productForm.markAllAsTouched();
    if (this.productForm.invalid || !this.dialogMode) {
      return;
    }

    this.saving = true;
    const categoryId = this.productForm.controls.productCategoryId.value;
    const categoryName = this.categories.find((category) => category.id === categoryId)?.productCategoryName;

    const payload = {
      productName: this.productForm.controls.productName.value,
      productDescription: this.productForm.controls.productDescription.value,
      productCategoryId: categoryId,
      productCategoryName: categoryName,
      orignalPrice: this.productForm.controls.orignalPrice.value,
      currentPrice: this.productForm.controls.currentPrice.value,
      currentCost: this.productForm.controls.currentCost.value,
      unitName: this.productForm.controls.unitName.value,
      displayPercentage: this.productForm.controls.displayPercentage.value,
      displayUnitName: this.productForm.controls.displayUnitName.value,
      imageURL: this.productForm.controls.imageURL.value,
      visible: this.productForm.controls.visible.value,
      order: this.productForm.controls.order.value,
    };

    const request$ =
      this.dialogMode === 'create'
        ? this.productService.create(payload)
        : this.productService.update({
            id: this.editingProductId as string,
            ...(payload as Omit<UpdateProductRequest, 'id'>),
          });

    request$
      .pipe(
        timeout(this.mutationTimeoutMs),
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          const action = this.dialogMode === 'create' ? 'created' : 'updated';
          this.setFeedback('success', `Product ${action} successfully.`);
          this.closeDialog();
          this.productService.load(true);
        },
        error: (error: unknown) => {
          this.setFeedback('error', this.getMutationErrorMessage(error));
        },
      });
  }

  categoryName(product: Product): string {
    const categoryId = this.resolveCategoryId(product);
    if (!categoryId) {
      return 'Unassigned';
    }

    return this.categories.find((category) => category.id === categoryId)?.productCategoryName || categoryId;
  }

  fieldTouched(field: 'productName' | 'productCategoryId' | 'unitName'): boolean {
    const control = this.productForm.controls[field];
    return control.touched || control.dirty;
  }

  get showNumericError(): boolean {
    return (
      this.productForm.controls.orignalPrice.invalid ||
      this.productForm.controls.currentPrice.invalid ||
      this.productForm.controls.currentCost.invalid ||
      this.productForm.controls.displayPercentage.invalid ||
      this.productForm.controls.order.invalid
    );
  }

  trackById(_: number, product: { id: string }): string {
    return product.id;
  }

  private resolveCategoryId(product: Product): string {
    return product.productCategory?.id || product.productCategoryId || '';
  }

  private setFeedback(tone: 'info' | 'success' | 'error', message: string): void {
    this.feedbackTone = tone;
    this.feedbackMessage = message;
    this.cdr.markForCheck();
  }

  private getMutationErrorMessage(error: unknown): string {
    if ((error as { name?: string })?.name === 'TimeoutError') {
      return 'Product request timed out. Please retry.';
    }

    const status = (error as { status?: number })?.status;
    if (status === 401 || status === 403) {
      return 'Authentication failed for this mutation request. Sign in again and retry.';
    }

    if (status === 400) {
      return 'The product payload failed backend validation. Review the form fields and retry.';
    }

    if (status === 0) {
      return 'Network error while contacting DukanzProduct endpoint.';
    }

    return 'Product mutation failed. Verify backend contract and retry.';
  }
}



