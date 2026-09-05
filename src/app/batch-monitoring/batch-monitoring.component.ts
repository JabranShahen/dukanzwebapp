import { Component, OnInit } from '@angular/core';

import { Area } from '../models/area.model';
import { AreaService } from '../services/area.service';
import {
  BATCH_MONITORING_STATUS_COLUMNS,
  BatchMonitoringResult,
  BatchMonitoringService,
  BatchMonitoringStatus,
  BatchSlotRow
} from './batch-monitoring.service';

const PAKISTAN_UTC_OFFSET_MS = 5 * 60 * 60 * 1000;

export function todayPakistanDateKey(now: Date = new Date()): string {
  return new Date(now.getTime() + PAKISTAN_UTC_OFFSET_MS).toISOString().slice(0, 10);
}

@Component({
  selector: 'app-batch-monitoring',
  templateUrl: './batch-monitoring.component.html',
  styleUrls: ['./batch-monitoring.component.scss']
})
export class BatchMonitoringComponent implements OnInit {
  readonly statusColumns = BATCH_MONITORING_STATUS_COLUMNS;

  areas: Area[] = [];
  selectedAreaId: string | null = null;
  selectedDate = todayPakistanDateKey();

  loadingAreas = false;
  loadingRows = false;
  hasLoadedRows = false;

  rows: BatchSlotRow[] = [];
  scheduleCount = 0;

  feedbackMessage = '';
  feedbackTone: 'success' | 'error' = 'success';

  private requestSequence = 0;

  constructor(
    private readonly areaService: AreaService,
    private readonly batchMonitoringService: BatchMonitoringService
  ) {}

  ngOnInit(): void {
    this.loadAreas();
  }

  get isLoading(): boolean {
    return this.loadingAreas || this.loadingRows;
  }

  get selectedAreaName(): string {
    const match = this.areas.find((area) => area.id === this.selectedAreaId);
    return match?.name || this.selectedAreaId || 'selected area';
  }

  get selectedDateLabel(): string {
    if (!this.selectedDate) {
      return '';
    }

    const [year, month, day] = this.selectedDate.split('-').map(Number);
    if (!year || !month || !day) {
      return this.selectedDate;
    }

    return new Date(year, month - 1, day).toLocaleDateString([], {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  get grandTotal(): number {
    return this.rows.reduce((sum, row) => sum + row.total, 0);
  }

  get showNoAreaState(): boolean {
    return !this.loadingAreas && this.areas.length === 0;
  }

  get showSelectAreaState(): boolean {
    return !this.loadingAreas && this.areas.length > 0 && !this.selectedAreaId;
  }

  get showEmptyScheduleState(): boolean {
    return this.hasLoadedRows
      && !this.loadingRows
      && !!this.selectedAreaId
      && this.scheduleCount === 0
      && this.rows.length === 0;
  }

  onAreaChange(): void {
    this.loadMonitoring();
  }

  onDateChange(): void {
    this.loadMonitoring();
  }

  refresh(): void {
    this.loadMonitoring();
  }

  onFeedbackDismissed(): void {
    this.feedbackMessage = '';
  }

  countFor(row: BatchSlotRow, status: BatchMonitoringStatus): number {
    return row.counts[status] ?? 0;
  }

  private loadAreas(): void {
    this.loadingAreas = true;
    this.areaService.getAll().subscribe({
      next: (areas) => {
        this.loadingAreas = false;
        this.areas = areas;

        if (!this.selectedAreaId && areas.length > 0) {
          const defaultArea = areas.find((area) => area.enabled !== false) ?? areas[0];
          this.selectedAreaId = defaultArea.id;
          this.loadMonitoring();
        }
      },
      error: () => {
        this.loadingAreas = false;
        this.feedbackTone = 'error';
        this.feedbackMessage = 'Failed to load areas.';
      }
    });
  }

  private loadMonitoring(): void {
    if (!this.selectedAreaId || !this.selectedDate) {
      this.rows = [];
      this.scheduleCount = 0;
      this.hasLoadedRows = false;
      return;
    }

    const requestId = ++this.requestSequence;
    this.loadingRows = true;
    this.feedbackMessage = '';

    this.batchMonitoringService.loadMonitoring(this.selectedAreaId, this.selectedDate).subscribe({
      next: (result: BatchMonitoringResult) => {
        if (requestId !== this.requestSequence) {
          return;
        }

        this.loadingRows = false;
        this.hasLoadedRows = true;
        this.scheduleCount = result.schedule.length;
        this.rows = result.rows;
      },
      error: () => {
        if (requestId !== this.requestSequence) {
          return;
        }

        this.loadingRows = false;
        this.hasLoadedRows = true;
        this.rows = [];
        this.scheduleCount = 0;
        this.feedbackTone = 'error';
        this.feedbackMessage = 'Failed to load batch monitoring data.';
      }
    });
  }
}
