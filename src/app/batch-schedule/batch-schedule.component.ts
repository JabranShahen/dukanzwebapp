import { Component, OnInit } from '@angular/core';

import { AuthService } from '../auth.service';
import { AreaService } from '../services/area.service';
import { BatchService } from '../services/batch.service';
import { Area } from '../models/area.model';
import { BatchScheduleWindow } from '../models/batch-schedule.model';

export interface EditableWindow extends BatchScheduleWindow {
  startEndError?: string;
  overlapError?: string;
}

@Component({
  selector: 'app-batch-schedule',
  templateUrl: './batch-schedule.component.html',
  styleUrls: ['./batch-schedule.component.scss']
})
export class BatchScheduleComponent implements OnInit {
  loading = false;
  saving = false;
  loadError = '';
  apiError = '';
  feedbackMessage = '';
  feedbackTone: 'success' | 'error' = 'success';

  areas: Area[] = [];
  selectedAreaId: string | null = null;
  windows: EditableWindow[] = [];
  private serverState: BatchScheduleWindow[] = [];

  get isSuperAdmin(): boolean {
    return this.authService.currentRole === 'superadmin';
  }

  get canEdit(): boolean {
    return this.isSuperAdmin;
  }

  get hasValidationErrors(): boolean {
    return this.windows.some((w) => !!w.startEndError || !!w.overlapError);
  }

  get effectiveAreaId(): string | null {
    return this.isSuperAdmin ? this.selectedAreaId : this.authService.currentAreaId;
  }

  constructor(
    readonly authService: AuthService,
    private readonly areaService: AreaService,
    private readonly batchService: BatchService
  ) {}

  ngOnInit(): void {
    if (this.isSuperAdmin) {
      this.areaService.getAll().subscribe({
        next: (areas) => {
          this.areas = areas;
          if (!this.selectedAreaId && this.areas.length > 0) {
            const firstEnabledArea = this.areas.find((area) => area.enabled) ?? this.areas[0];
            this.selectedAreaId = firstEnabledArea.id;
            this.loadSchedule();
          }
        },
        error: () => {
          this.loadError = 'Failed to load areas. Check your connection and try again.';
        }
      });
    } else {
      this.loadSchedule();
    }
  }

  onAreaChange(): void {
    this.loadSchedule();
  }

  loadSchedule(): void {
    const areaId = this.effectiveAreaId;
    if (!areaId) {
      this.windows = [];
      this.serverState = [];
      return;
    }
    this.loading = true;
    this.loadError = '';
    this.apiError = '';
    this.batchService.getSchedule(areaId).subscribe({
      next: (windows) => {
        this.loading = false;
        const safeWindows = Array.isArray(windows) ? windows : [];
        this.serverState = safeWindows;
        this.windows = safeWindows.map((w) => ({ ...w }));
      },
      error: () => {
        this.loading = false;
        this.loadError = 'Failed to load batch schedule. Check your connection and try again.';
      }
    });
  }

  addWindow(): void {
    if (this.windows.length >= 10) return;
    const nextIndex = this.windows.reduce((max, w) => Math.max(max, w.batchIndex), 0) + 1;
    this.windows.push({
      batchIndex: nextIndex,
      label: '',
      startTimePkt: '',
      endTimePkt: '',
      enabled: true
    });
    this.validateWindows();
  }

  removeWindow(index: number): void {
    this.windows.splice(index, 1);
    this.validateWindows();
  }

  onFieldChange(): void {
    this.validateWindows();
  }

  onReset(): void {
    this.windows = this.serverState.map((w) => ({ ...w }));
    this.apiError = '';
    this.validateWindows();
  }

  onSave(): void {
    this.validateWindows();
    if (this.hasValidationErrors) return;
    const areaId = this.effectiveAreaId;
    if (!areaId) return;

    this.saving = true;
    this.apiError = '';

    const payload: BatchScheduleWindow[] = this.windows.map((w) => ({
      batchIndex: w.batchIndex,
      label: w.label,
      startTimePkt: w.startTimePkt,
      endTimePkt: w.endTimePkt,
      enabled: w.enabled
    }));

    this.batchService.saveSchedule(areaId, payload).subscribe({
      next: (saved) => {
        this.saving = false;
        this.serverState = saved;
        this.windows = saved.map((w) => ({ ...w }));
        this.feedbackTone = 'success';
        this.feedbackMessage = 'Batch schedule saved.';
      },
      error: (err: { error?: { errors?: string[] } }) => {
        this.saving = false;
        const body = err?.error;
        if (body?.errors && Array.isArray(body.errors) && body.errors.length > 0) {
          this.apiError = body.errors.join(' ');
        } else {
          this.apiError = 'Failed to save batch schedule.';
        }
      }
    });
  }

  onFeedbackDismissed(): void {
    this.feedbackMessage = '';
  }

  validateWindows(): void {
    for (const w of this.windows) {
      w.startEndError = undefined;
      w.overlapError = undefined;
    }

    for (const w of this.windows) {
      if (w.startTimePkt && w.endTimePkt && w.startTimePkt >= w.endTimePkt) {
        w.startEndError = 'End time must be after start time';
      }
    }

    const enabled = this.windows.filter((w) => w.enabled && !w.startEndError);
    for (let i = 0; i < enabled.length; i++) {
      for (let j = i + 1; j < enabled.length; j++) {
        if (this.timesOverlap(enabled[i], enabled[j])) {
          if (!enabled[i].overlapError) {
            enabled[i].overlapError =
              `Window overlaps with Batch ${enabled[j].batchIndex} (${enabled[j].label || 'unnamed'})`;
          }
          if (!enabled[j].overlapError) {
            enabled[j].overlapError =
              `Window overlaps with Batch ${enabled[i].batchIndex} (${enabled[i].label || 'unnamed'})`;
          }
        }
      }
    }
  }

  timesOverlap(a: BatchScheduleWindow, b: BatchScheduleWindow): boolean {
    if (!a.startTimePkt || !a.endTimePkt || !b.startTimePkt || !b.endTimePkt) return false;
    return a.startTimePkt < b.endTimePkt && b.startTimePkt < a.endTimePkt;
  }
}
