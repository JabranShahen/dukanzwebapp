import { AsyncPipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription, finalize, timeout } from 'rxjs';

import { CreateDukanzConfigRequest, UpdateDukanzConfigRequest } from '../entities/dukanz-config';
import { DukanzConfigService } from '../services/dukanz-config.service';
import { ManagementHeaderComponent } from '../shared/management-header/management-header.component';
import { ManagementPanelComponent } from '../shared/management-panel/management-panel.component';
import { UiButtonComponent } from '../shared/ui/ui-button/ui-button.component';
import { UiEmptyStateComponent } from '../shared/ui/ui-empty-state/ui-empty-state.component';
import { UiFeedbackComponent } from '../shared/ui/ui-feedback/ui-feedback.component';
import { UiSkeletonComponent } from '../shared/ui/ui-skeleton/ui-skeleton.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    CommonModule,
    AsyncPipe,
    ReactiveFormsModule,
    ManagementHeaderComponent,
    ManagementPanelComponent,
    UiButtonComponent,
    UiEmptyStateComponent,
    UiFeedbackComponent,
    UiSkeletonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page" *ngIf="state$ | async as state">
      <app-management-header eyebrow="DukanzConfig" [title]="pageTitle" [subtext]="pageBody"></app-management-header>

      <app-management-panel title="Configuration" description="Editable DukanzConfig contract with initialize and save workflows.">
        <app-ui-feedback *ngIf="feedbackMessage" [tone]="feedbackTone" [message]="feedbackMessage"></app-ui-feedback>

        <ng-container [ngSwitch]="state.status">
          <app-ui-skeleton *ngSwitchCase="'loading'" [rows]="8" height="1.15rem"></app-ui-skeleton>

          <div *ngSwitchCase="'empty'" class="empty-shell">
            <app-ui-empty-state
              icon="CF"
              title="No config payload returned"
              body="Initialize DukanzConfig to enable settings persistence."
              ctaLabel="Initialize config"
              (ctaClick)="initializeConfig()"
            ></app-ui-empty-state>
            <app-ui-button variant="ghost" (clicked)="refresh()">Retry fetch</app-ui-button>
          </div>

          <app-ui-empty-state
            *ngSwitchCase="'error'"
            icon="ER"
            [title]="state.error ? 'Config endpoint not yet verified' : 'Config endpoint not ready'"
            [body]="state.error || 'The config service is wired, but the backend response is still pending validation.'"
            ctaLabel="Retry"
            (ctaClick)="refresh()"
          ></app-ui-empty-state>

          <form *ngSwitchCase="'ready'" [formGroup]="configForm" class="form-grid" (ngSubmit)="saveChanges()">
            <label>
              Message
              <textarea formControlName="message" rows="3"></textarea>
            </label>

            <div class="number-grid">
              <label>
                Delivery charges
                <input type="number" formControlName="deliveryCharges" min="0" step="0.01" />
              </label>
              <label>
                Min order size
                <input type="number" formControlName="minOrderSize" min="0" step="0.01" />
              </label>
              <label>
                Max order size
                <input type="number" formControlName="maxOrderSize" min="0" step="0.01" />
              </label>
              <label>
                Free delivery order size
                <input type="number" formControlName="freeDeliveryOrderSize" min="0" step="0.01" />
              </label>
              <label>
                Max active orders
                <input type="number" formControlName="maxNumberOfActiveOrders" min="0" step="1" />
              </label>
              <label>
                Min active-screen hours
                <input type="number" formControlName="minOrderActiveScreenPresenseHours" min="0" step="1" />
              </label>
              <label>
                Max history orders
                <input type="number" formControlName="maxNumberOfHistoryOrders" min="0" step="1" />
              </label>
            </div>

            <label>
              Cutoff time
              <input type="text" formControlName="cutoffTime" placeholder="17:00" />
            </label>

            <label>
              Contact phone number
              <input type="text" formControlName="contactPhoneNumber" placeholder="+44..." />
            </label>

            <div class="section-heading">App Version Control</div>

            <div class="number-grid">
              <label>
                Latest app version
                <input type="text" formControlName="latestAppVersion" placeholder="1.0.0" />
              </label>
              <label>
                Minimum supported version
                <input type="text" formControlName="minimumSupportedAppVersion" placeholder="1.0.0" />
              </label>
            </div>

            <label>
              Play Store URL
              <input type="text" formControlName="appUpgradePlayStoreUrl" placeholder="https://play.google.com/store/apps/details?id=..." />
            </label>

            <label class="checkbox-label">
              <input type="checkbox" formControlName="forceAppUpgrade" />
              Force upgrade (blocks app until updated)
            </label>

            <div class="form-actions">
              <app-ui-button variant="secondary" [disabled]="saving" (clicked)="refresh()">Refresh</app-ui-button>
              <app-ui-button type="submit" [disabled]="configForm.invalid || configForm.pristine || saving">
                {{ saving ? 'Saving...' : 'Save changes' }}
              </app-ui-button>
            </div>
          </form>
        </ng-container>
      </app-management-panel>
    </div>
  `,
  styles: [
    `
      .page {
        display: grid;
        gap: 1.5rem;
      }

      .empty-shell {
        display: grid;
        gap: 0.8rem;
      }

      .form-grid {
        display: grid;
        gap: 0.8rem;
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

      input,
      textarea {
        border: 1px solid rgba(20, 50, 46, 0.18);
        border-radius: 12px;
        padding: 0.65rem 0.75rem;
      }

      .form-actions {
        display: flex;
        justify-content: end;
        gap: 0.6rem;
      }

      .section-heading {
        font-weight: 700;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.5;
        padding-top: 0.5rem;
        border-top: 1px solid rgba(20, 50, 46, 0.1);
      }

      .checkbox-label {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        cursor: pointer;
      }

      .checkbox-label input[type="checkbox"] {
        width: 1rem;
        height: 1rem;
        border-radius: 4px;
        cursor: pointer;
      }

      @media (max-width: 900px) {
        .number-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class SettingsPageComponent implements OnInit, OnDestroy {
  private readonly mutationTimeoutMs = 20000;
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly configService = inject(DukanzConfigService);
  private readonly formBuilder = inject(FormBuilder);

  private readonly subscriptions = new Subscription();

  readonly state$ = this.configService.state$;
  pageTitle = 'Settings';
  pageBody = 'Environment and DukanzConfig-driven settings will migrate here.';
  currentConfigId: string | null = null;
  saving = false;
  feedbackMessage = '';
  feedbackTone: 'info' | 'success' | 'error' = 'info';

  readonly configForm = this.formBuilder.nonNullable.group({
    message: ['', [Validators.maxLength(500)]],
    deliveryCharges: [0, [Validators.required, Validators.min(0)]],
    minOrderSize: [0, [Validators.required, Validators.min(0)]],
    maxOrderSize: [0, [Validators.required, Validators.min(0)]],
    freeDeliveryOrderSize: [0, [Validators.required, Validators.min(0)]],
    cutoffTime: ['', [Validators.required, Validators.maxLength(25)]],
    maxNumberOfActiveOrders: [0, [Validators.required, Validators.min(0)]],
    minOrderActiveScreenPresenseHours: [0, [Validators.required, Validators.min(0)]],
    maxNumberOfHistoryOrders: [0, [Validators.required, Validators.min(0)]],
    contactPhoneNumber: ['', [Validators.required, Validators.maxLength(40)]],
    latestAppVersion: ['', [Validators.maxLength(20)]],
    minimumSupportedAppVersion: ['', [Validators.maxLength(20)]],
    appUpgradePlayStoreUrl: ['', [Validators.maxLength(500)]],
    forceAppUpgrade: [false],
  });

  ngOnInit(): void {
    this.pageTitle = this.route.snapshot.data['pageTitle'] ?? this.pageTitle;
    this.pageBody = this.route.snapshot.data['pageBody'] ?? this.pageBody;

    this.subscriptions.add(
      this.state$.subscribe((state) => {
        if (state.status === 'ready' && state.data) {
          this.currentConfigId = state.data.id;
          this.configForm.reset({
            message: state.data.message,
            deliveryCharges: state.data.deliveryCharges,
            minOrderSize: state.data.minOrderSize,
            maxOrderSize: state.data.maxOrderSize,
            freeDeliveryOrderSize: state.data.freeDeliveryOrderSize,
            cutoffTime: state.data.cutoffTime,
            maxNumberOfActiveOrders: state.data.maxNumberOfActiveOrders,
            minOrderActiveScreenPresenseHours: state.data.minOrderActiveScreenPresenseHours,
            maxNumberOfHistoryOrders: state.data.maxNumberOfHistoryOrders,
            contactPhoneNumber: state.data.contactPhoneNumber,
            latestAppVersion: state.data.latestAppVersion,
            minimumSupportedAppVersion: state.data.minimumSupportedAppVersion,
            appUpgradePlayStoreUrl: state.data.appUpgradePlayStoreUrl,
            forceAppUpgrade: state.data.forceAppUpgrade,
          });
        }

        if (state.status === 'empty') {
          this.currentConfigId = null;
          this.configForm.reset(this.defaultValues());
        }
      }),
    );

    this.configService.load();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  refresh(): void {
    this.configService.load(true);
  }

  initializeConfig(): void {
    const payload = this.toCreatePayload();
    this.saving = true;
    this.configService
      .initialize(payload)
      .pipe(
        timeout(this.mutationTimeoutMs),
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.setFeedback('success', 'Config initialized successfully.');
          this.configService.load(true);
        },
        error: (error: unknown) => {
          this.setFeedback('error', this.getMutationErrorMessage(error));
        },
      });
  }

  saveChanges(): void {
    this.configForm.markAllAsTouched();
    if (this.configForm.invalid || this.configForm.pristine || !this.currentConfigId) {
      return;
    }

    this.saving = true;
    const payload = this.toUpdatePayload(this.currentConfigId);

    this.configService
      .update(payload)
      .pipe(
        timeout(this.mutationTimeoutMs),
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
      )
      .subscribe({
        next: () => {
          this.setFeedback('success', 'Config updated successfully.');
          this.configForm.markAsPristine();
          this.configService.load(true);
        },
        error: (error: unknown) => {
          this.setFeedback('error', this.getMutationErrorMessage(error));
        },
      });
  }

  private toCreatePayload(): CreateDukanzConfigRequest {
    const form = this.configForm.getRawValue();
    return {
      ...form,
    };
  }

  private toUpdatePayload(id: string): UpdateDukanzConfigRequest {
    const form = this.configForm.getRawValue();
    return {
      id,
      ...form,
    };
  }

  private defaultValues(): Omit<CreateDukanzConfigRequest, 'id'> {
    return {
      message: '',
      deliveryCharges: 0,
      minOrderSize: 0,
      maxOrderSize: 0,
      freeDeliveryOrderSize: 0,
      cutoffTime: '17:00',
      maxNumberOfActiveOrders: 0,
      minOrderActiveScreenPresenseHours: 0,
      maxNumberOfHistoryOrders: 0,
      contactPhoneNumber: '',
      latestAppVersion: '',
      minimumSupportedAppVersion: '',
      appUpgradePlayStoreUrl: '',
      forceAppUpgrade: false,
    };
  }

  private setFeedback(tone: 'info' | 'success' | 'error', message: string): void {
    this.feedbackTone = tone;
    this.feedbackMessage = message;
    this.cdr.markForCheck();
  }

  private getMutationErrorMessage(error: unknown): string {
    if ((error as { name?: string })?.name === 'TimeoutError') {
      return 'Config request timed out. Please retry.';
    }

    const status = (error as { status?: number })?.status;
    if (status === 401 || status === 403) {
      return 'Authentication failed for this mutation request. Sign in again and retry.';
    }

    if (status === 400) {
      return 'The config payload failed backend validation. Review the form fields and retry.';
    }

    if (status === 0) {
      return 'Network error while contacting DukanzConfig endpoint.';
    }

    return 'Config mutation failed. Verify backend contract and retry.';
  }
}



