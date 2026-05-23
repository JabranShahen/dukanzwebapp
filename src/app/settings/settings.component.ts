import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { ConfigContext, ConfigField, DukanzConfig } from '../models/dukanz-config.model';
import { Area } from '../models/area.model';
import { AuthService } from '../auth.service';
import { DukanzConfigService } from '../services/dukanz-config.service';
import { AreaService } from '../services/area.service';
import { OrderService } from '../services/order.service';

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
  broadcasting = false;

  areas: Area[] = [];
  selectedAreaId: string | null = null;
  inheritedFields = new Set<ConfigField>();

  private currentConfigId: string | null = null;
  private configContext: ConfigContext | null = null;

  get isSuperAdmin(): boolean {
    return this.authService.currentRole === 'superadmin';
  }

  isInherited(field: ConfigField): boolean {
    if (!this.isSuperAdmin || !this.configContext || !this.selectedAreaId) return false;
    const { areaConfig, globalConfig } = this.configContext;
    if (!globalConfig) return false;
    if (!areaConfig) return true;
    const normalize = (v: unknown): unknown => (v == null || v === '') ? '' : v;
    return normalize((areaConfig as unknown as Record<string, unknown>)[field]) ===
           normalize((globalConfig as unknown as Record<string, unknown>)[field]);
  }

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
    deliveryOffsetDays: [1, [Validators.required, Validators.min(0)]],
    latestAppVersion: ['', [Validators.maxLength(50)]],
    minimumSupportedAppVersion: ['', [Validators.maxLength(50)]],
    appUpgradePlayStoreUrl: ['', [Validators.maxLength(500)]],
    forceAppUpgrade: [false]
  });

  constructor(
    private readonly authService: AuthService,
    private readonly configService: DukanzConfigService,
    private readonly areaService: AreaService,
    private readonly formBuilder: FormBuilder,
    private readonly orderService: OrderService
  ) {}

  ngOnInit(): void {
    if (this.isSuperAdmin) {
      this.areaService.getAll().subscribe({
        next: (areas) => { this.areas = areas; }
      });
    }
    this.loadConfig();
  }

  onAreaChange(): void {
    this.currentConfigId = null;
    this.loadConfig();
  }

  loadConfig(): void {
    this.loading = true;
    this.loadError = '';
    this.configContext = null;
    this.inheritedFields.clear();

    if (this.isSuperAdmin) {
      this.configService.getConfigContext(this.selectedAreaId).subscribe({
        next: (ctx) => {
          this.loading = false;
          this.configContext = ctx;
          this.refreshInheritedFields();
          if (ctx.effectiveConfig) {
            this.applyConfigToForm(ctx.effectiveConfig);
          }
        },
        error: () => {
          this.loading = false;
          this.loadError = 'Failed to load configuration. Check your connection and try again.';
        }
      });
    } else {
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
  }

  private refreshInheritedFields(): void {
    this.inheritedFields.clear();
    if (!this.configContext) return;
    const fields: ConfigField[] = [
      'message', 'contactPhoneNumber', 'cutoffTime', 'deliveryOffsetDays',
      'deliveryCharges', 'minOrderSize', 'maxOrderSize', 'freeDeliveryOrderSize',
      'maxNumberOfActiveOrders', 'minOrderActiveScreenPresenseHours', 'maxNumberOfHistoryOrders',
      'latestAppVersion', 'minimumSupportedAppVersion', 'appUpgradePlayStoreUrl', 'forceAppUpgrade'
    ];
    for (const f of fields) {
      if (this.isInherited(f)) this.inheritedFields.add(f);
    }
  }

  onSave(): void {
    this.configForm.markAllAsTouched();

    if (this.configForm.invalid) {
      return;
    }

    const value = this.configForm.getRawValue();
    this.saving = true;

    const saveAreaId = this.isSuperAdmin ? this.selectedAreaId : this.authService.currentAreaId;

    // When saving for a specific area, only reuse an existing ID if there is
    // already an area-specific record — never reuse the global record's ID.
    const saveId = (this.isSuperAdmin && this.selectedAreaId)
      ? (this.configContext?.areaConfig?.id || undefined)
      : (this.currentConfigId || undefined);

    this.configService
      .save({
        id: saveId,
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
        deliveryOffsetDays: value.deliveryOffsetDays,
        latestAppVersion: value.latestAppVersion,
        minimumSupportedAppVersion: value.minimumSupportedAppVersion,
        appUpgradePlayStoreUrl: value.appUpgradePlayStoreUrl,
        forceAppUpgrade: value.forceAppUpgrade,
        areaId: saveAreaId
      }, saveAreaId ?? undefined)
      .subscribe({
        next: (saved) => {
          this.saving = false;
          this.currentConfigId = saved.id || this.currentConfigId;
          this.loadConfig();
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

  onBroadcastAppUpdate(): void {
    if (this.broadcasting) {
      return;
    }
    this.broadcasting = true;
    this.orderService.broadcastAppUpdate().subscribe({
      next: (result) => {
        this.broadcasting = false;
        this.feedbackTone = 'success';
        this.feedbackMessage = `Update notification sent to ${result.notified} of ${result.total} registered devices.`;
      },
      error: () => {
        this.broadcasting = false;
        this.feedbackTone = 'error';
        this.feedbackMessage = 'Failed to send update notification. Check your connection and try again.';
      }
    });
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
      deliveryOffsetDays: config.deliveryOffsetDays ?? 1,
      latestAppVersion: config.latestAppVersion || '',
      minimumSupportedAppVersion: config.minimumSupportedAppVersion || '',
      appUpgradePlayStoreUrl: config.appUpgradePlayStoreUrl || '',
      forceAppUpgrade: !!config.forceAppUpgrade
    });
  }
}
