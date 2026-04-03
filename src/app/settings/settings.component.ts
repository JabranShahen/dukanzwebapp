import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { DukanzConfig } from '../models/dukanz-config.model';
import { DukanzConfigService } from '../services/dukanz-config.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  loading = true;
  saving = false;
  loadError = '';
  feedbackMessage = '';
  feedbackTone: 'success' | 'error' = 'success';

  private currentConfigId: string | null = null;

  readonly configForm = this.formBuilder.nonNullable.group({
    message: ['', [Validators.maxLength(500)]],
    contactPhoneNumber: ['', [Validators.maxLength(50)]],
    cutoffTime: ['', [Validators.maxLength(50)]],
    deliveryCharges: [0, [Validators.required, Validators.min(0)]],
    minOrderSize: [0, [Validators.required, Validators.min(0)]],
    maxOrderSize: [0, [Validators.required, Validators.min(0)]],
    freeDeliveryOrderSize: [0, [Validators.required, Validators.min(0)]],
    maxNumberOfActiveOrders: [0, [Validators.required, Validators.min(0)]],
    minOrderActiveScreenPresenseHours: [0, [Validators.required, Validators.min(0)]],
    maxNumberOfHistoryOrders: [0, [Validators.required, Validators.min(0)]],
    deliveryOffsetDays: [1, [Validators.required, Validators.min(0)]]
  });

  constructor(
    private readonly configService: DukanzConfigService,
    private readonly formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.loading = true;
    this.loadError = '';

    this.configService.getConfig().subscribe({
      next: (config) => {
        this.loading = false;
        if (config) {
          this.applyConfigToForm(config);
        }
      },
      error: () => {
        this.loading = false;
        this.loadError = 'Failed to load configuration. Check your connection and try again.';
      }
    });
  }

  onSave(): void {
    this.configForm.markAllAsTouched();

    if (this.configForm.invalid) {
      return;
    }

    const value = this.configForm.getRawValue();
    this.saving = true;

    this.configService
      .save({
        id: this.currentConfigId || undefined,
        message: value.message,
        contactPhoneNumber: value.contactPhoneNumber,
        cutoffTime: value.cutoffTime,
        deliveryCharges: value.deliveryCharges,
        minOrderSize: value.minOrderSize,
        maxOrderSize: value.maxOrderSize,
        freeDeliveryOrderSize: value.freeDeliveryOrderSize,
        maxNumberOfActiveOrders: value.maxNumberOfActiveOrders,
        minOrderActiveScreenPresenseHours: value.minOrderActiveScreenPresenseHours,
        maxNumberOfHistoryOrders: value.maxNumberOfHistoryOrders,
        deliveryOffsetDays: value.deliveryOffsetDays
      })
      .subscribe({
        next: (saved) => {
          this.saving = false;
          this.currentConfigId = saved.id || this.currentConfigId;
          // Reload from the server to confirm the save persisted.
          this.configService.getConfig().subscribe({
            next: (confirmed) => {
              if (confirmed) {
                this.applyConfigToForm(confirmed);
              }
            }
          });
          this.feedbackTone = 'success';
          this.feedbackMessage = 'Configuration saved.';
        },
        error: () => {
          this.saving = false;
          this.feedbackTone = 'error';
          this.feedbackMessage = 'Failed to save configuration.';
        }
      });
  }

  onFeedbackDismissed(): void {
    this.feedbackMessage = '';
  }

  private applyConfigToForm(config: DukanzConfig): void {
    this.currentConfigId = config.id || null;
    this.configForm.setValue({
      message: config.message || '',
      contactPhoneNumber: config.contactPhoneNumber || '',
      cutoffTime: config.cutoffTime || '',
      deliveryCharges: config.deliveryCharges ?? 0,
      minOrderSize: config.minOrderSize ?? 0,
      maxOrderSize: config.maxOrderSize ?? 0,
      freeDeliveryOrderSize: config.freeDeliveryOrderSize ?? 0,
      maxNumberOfActiveOrders: config.maxNumberOfActiveOrders ?? 0,
      minOrderActiveScreenPresenseHours: config.minOrderActiveScreenPresenseHours ?? 0,
      maxNumberOfHistoryOrders: config.maxNumberOfHistoryOrders ?? 0,
      deliveryOffsetDays: config.deliveryOffsetDays ?? 1
    });
  }
}
