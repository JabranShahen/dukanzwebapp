import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, timeout } from 'rxjs';

import { ProductCategory, UpdateProductCategoryRequest } from '../entities/product-category';
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
  selector: 'app-category-management',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
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
        ctaLabel="Create category"
        ctaVariant="primary"
        (ctaClick)="openCreateCategory(state.data)"
      ></app-management-header>

      <app-management-panel>
        <div panel-actions class="panel-actions">
          <app-ui-count-badge [count]="state.data.length" label="categories"></app-ui-count-badge>
          <app-ui-button variant="secondary" (clicked)="refresh()">Refresh</app-ui-button>
        </div>

        <app-ui-feedback *ngIf="feedbackMessage" [tone]="feedbackTone" [message]="feedbackMessage"></app-ui-feedback>

        <ng-container [ngSwitch]="state.status">
          <app-ui-skeleton *ngSwitchCase="'loading'" [rows]="5" height="1.15rem"></app-ui-skeleton>

          <div *ngSwitchCase="'empty'" class="empty-shell">
            <app-ui-empty-state
              icon="CT"
              title="No categories yet"
              body="Create your first category to enable category assignment in product workflows."
              ctaLabel="Create category"
              (ctaClick)="openCreateCategory(state.data)"
            ></app-ui-empty-state>
            <app-ui-button variant="ghost" (clicked)="refresh()">Retry fetch</app-ui-button>
          </div>

          <app-ui-empty-state
            *ngSwitchCase="'error'"
            icon="ER"
            title="Category endpoint needs attention"
            [body]="state.error || 'The category service is wired, but the backend response could not be read.'"
            ctaLabel="Retry"
            (ctaClick)="refresh()"
          ></app-ui-empty-state>

          <app-ui-table *ngSwitchCase="'ready'">
            <table class="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Image</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let category of state.data; trackBy: trackById">
                  <td>
                    <strong>{{ category.productCategoryName }}</strong>
                  </td>
                  <td>{{ category.productCategoryImageURL || 'N/A' }}</td>
                  <td>{{ category.order }}</td>
                  <td>
                    <app-ui-status-pill
                      [label]="category.visible ? 'Visible' : 'Hidden'"
                      [tone]="category.visible ? 'success' : 'warning'"
                    ></app-ui-status-pill>
                  </td>
                  <td class="actions">
                    <app-ui-icon-button icon="ED" label="Edit" (clicked)="openEditCategory(category)"></app-ui-icon-button>
                    <app-ui-icon-button
                      icon="RM"
                      label="Delete"
                      variant="danger"
                      (clicked)="requestDeleteCategory(category)"
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
      [title]="dialogMode === 'create' ? 'Create category' : 'Edit category'"
      [description]="'Required fields are validated before save.'"
      (closeRequested)="closeDialog()"
    >
      <form [formGroup]="categoryForm" class="form-grid" (ngSubmit)="submitCategory()">
        <label>
          Name
          <input type="text" formControlName="productCategoryName" placeholder="Bakery" />
        </label>
        <p class="error" *ngIf="fieldTouched('productCategoryName') && categoryForm.controls.productCategoryName.hasError('required')">
          Name is required.
        </p>
        <p class="error" *ngIf="fieldTouched('productCategoryName') && categoryForm.controls.productCategoryName.hasError('duplicate')">
          Category name must be unique.
        </p>

        <label>
          Image URL
          <input type="text" formControlName="productCategoryImageURL" placeholder="https://..." />
        </label>

        <label>
          Order
          <input type="number" formControlName="order" min="0" step="1" />
        </label>
        <p class="error" *ngIf="fieldTouched('order') && categoryForm.controls.order.invalid">Order must be 0 or higher.</p>

        <label class="checkbox-row">
          <input type="checkbox" formControlName="visible" />
          Visible in storefront
        </label>

        <div modal-actions>
          <app-ui-button variant="ghost" (clicked)="closeDialog()">Cancel</app-ui-button>
          <app-ui-button type="button" [disabled]="categoryForm.invalid || saving" (clicked)="submitCategory()">
            {{ saving ? 'Saving...' : dialogMode === 'create' ? 'Create category' : 'Save changes' }}
          </app-ui-button>
        </div>
      </form>
    </app-ui-modal>

    <app-ui-confirm-dialog
      *ngIf="pendingDelete"
      title="Delete category"
      [message]="'Delete ' + pendingDelete.productCategoryName + '? This action cannot be undone.'"
      confirmLabel="Delete"
      confirmVariant="danger"
      (cancel)="pendingDelete = null"
      (confirm)="deleteCategory()"
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
        vertical-align: top;
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

      label {
        display: grid;
        gap: 0.35rem;
        font-weight: 600;
      }

      input[type='text'],
      input[type='number'] {
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

      @media (max-width: 800px) {
        th,
        td {
          padding: 0.75rem;
        }
      }
    `,
  ],
})
export class CategoryManagementComponent implements OnInit {
  private readonly mutationTimeoutMs = 20000;
  readonly state$;

  dialogMode: 'create' | 'edit' | null = null;
  editingCategoryId: string | null = null;
  pendingDelete: ProductCategory | null = null;
  saving = false;
  feedbackMessage = '';
  feedbackTone: 'info' | 'success' | 'error' = 'info';

  readonly categoryForm;

  constructor(
    private readonly productCategoryService: ProductCategoryService,
    private readonly formBuilder: FormBuilder,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.state$ = this.productCategoryService.state$;
    this.categoryForm = this.formBuilder.nonNullable.group({
      productCategoryName: ['', [Validators.required, Validators.maxLength(120)]],
      productCategoryImageURL: [''],
      visible: [true],
      order: [0, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.productCategoryService.load();
  }

  refresh(): void {
    this.productCategoryService.load(true);
  }

  openCreateCategory(existing: ProductCategory[]): void {
    this.feedbackMessage = '';
    this.dialogMode = 'create';
    this.editingCategoryId = null;
    this.categoryForm.reset({
      productCategoryName: '',
      productCategoryImageURL: '',
      visible: true,
      order: existing.length,
    });
  }

  openEditCategory(category: ProductCategory): void {
    this.feedbackMessage = '';
    this.dialogMode = 'edit';
    this.editingCategoryId = category.id;
    this.categoryForm.reset({
      productCategoryName: category.productCategoryName,
      productCategoryImageURL: category.productCategoryImageURL || '',
      visible: category.visible,
      order: category.order,
    });
  }

  closeDialog(): void {
    this.dialogMode = null;
    this.editingCategoryId = null;
    this.categoryForm.setErrors(null);
  }

  requestDeleteCategory(category: ProductCategory): void {
    this.pendingDelete = category;
  }

  deleteCategory(): void {
    const category = this.pendingDelete;
    if (!category) {
      return;
    }

    this.pendingDelete = null;
    this.productCategoryService.delete(category).subscribe({
      next: () => {
        this.setFeedback('success', `Category \"${category.productCategoryName}\" deleted.`);
        this.refresh();
      },
      error: (error: unknown) => {
        this.setFeedback('error', this.getMutationErrorMessage(error));
      },
    });
  }

  submitCategory(): void {
    this.categoryForm.markAllAsTouched();
    if (this.categoryForm.invalid || !this.dialogMode) {
      return;
    }

    const state = this.productCategoryService.getSnapshot();
    const name = this.categoryForm.controls.productCategoryName.value.trim().toLowerCase();
    const duplicate = state.data.some(
      (category) => category.productCategoryName.trim().toLowerCase() === name && category.id !== this.editingCategoryId,
    );
    if (duplicate) {
      this.categoryForm.controls.productCategoryName.setErrors({ duplicate: true });
      return;
    }

    this.saving = true;
    const payload = {
      productCategoryName: this.categoryForm.controls.productCategoryName.value,
      productCategoryImageURL: this.categoryForm.controls.productCategoryImageURL.value,
      visible: this.categoryForm.controls.visible.value,
      order: this.categoryForm.controls.order.value,
    };

    const request$ =
      this.dialogMode === 'create'
        ? this.productCategoryService.create(payload)
        : this.productCategoryService.update({
            id: this.editingCategoryId as string,
            ...(payload as Omit<UpdateProductCategoryRequest, 'id'>),
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
          this.setFeedback('success', `Category ${action} successfully.`);
          this.closeDialog();
          this.refresh();
        },
        error: (error: unknown) => {
          this.setFeedback('error', this.getMutationErrorMessage(error));
        },
      });
  }

  fieldTouched(field: 'productCategoryName' | 'order'): boolean {
    const control = this.categoryForm.controls[field];
    return control.touched || control.dirty;
  }

  trackById(_: number, category: { id: string }): string {
    return category.id;
  }

  private setFeedback(tone: 'info' | 'success' | 'error', message: string): void {
    this.feedbackTone = tone;
    this.feedbackMessage = message;
    this.cdr.markForCheck();
  }

  private getMutationErrorMessage(error: unknown): string {
    if ((error as { name?: string })?.name === 'TimeoutError') {
      return 'Category request timed out. Please retry.';
    }

    const status = (error as { status?: number })?.status;
    const errorPayload = (error as { error?: unknown })?.error as
      | { title?: string; detail?: string; message?: string }
      | string
      | undefined;
    const detail =
      typeof errorPayload === 'string'
        ? errorPayload
        : errorPayload?.detail || errorPayload?.title || errorPayload?.message || '';

    if (status === 401 || status === 403) {
      return 'Authentication failed for this mutation request. Sign in again and retry.';
    }

    if (status === 400) {
      return detail || 'The category payload failed backend validation. Review the form fields and retry.';
    }

    if (status === 404 || status === 405) {
      return 'Category endpoint method is not available on this API deployment. Try refresh and retry.';
    }

    if (status === 415) {
      return 'Category endpoint rejected request media type. Contract fallback was attempted; backend contract still mismatched.';
    }

    if (status === 0) {
      return 'Network error while contacting category endpoint.';
    }

    return detail || `Category mutation failed (HTTP ${status ?? 'unknown'}). Verify backend contract and retry.`;
  }
}



