import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import {
  DISPLAYABLE_EVENT_LIFECYCLE_STATUSES,
  EDITABLE_EVENT_LIFECYCLE_STATUSES,
  EventLifecycleStatus,
  EventMutation,
  EventRecord
} from '../../models/event.model';

@Component({
  selector: 'app-edit-event-modal',
  templateUrl: './edit-event-modal.component.html',
  styleUrls: ['./edit-event-modal.component.scss']
})
export class EditEventModalComponent implements OnChanges {
  @Input() eventRecord: EventRecord | null = null;
  @Input() pending = false;
  @Output() cancelled = new EventEmitter<void>();
  @Output() saved = new EventEmitter<EventMutation>();

  nameError = '';
  dateRangeError = '';
  lifecycleOptions: string[] = EDITABLE_EVENT_LIFECYCLE_STATUSES;

  readonly eventForm = this.formBuilder.nonNullable.group({
    eventName: ['', [Validators.required, Validators.maxLength(120)]],
    eventDescription: ['', [Validators.maxLength(500)]],
    lifecycleStatus: ['draft', [Validators.required]],
    startDateUtc: [''],
    endDateUtc: ['']
  });

  constructor(private readonly formBuilder: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['eventRecord'] && this.eventRecord) {
      const normalizedLifecycle = this.normalizeLifecycleStatus(this.eventRecord.lifecycleStatus);
      this.lifecycleOptions = this.resolveLifecycleOptions(normalizedLifecycle);
      this.eventForm.reset({
        eventName: this.eventRecord.eventName || '',
        eventDescription: this.eventRecord.eventDescription || '',
        lifecycleStatus: normalizedLifecycle,
        startDateUtc: this.toDateTimeLocalValue(this.eventRecord.startDateUtc),
        endDateUtc: this.toDateTimeLocalValue(this.eventRecord.endDateUtc)
      });
      this.nameError = '';
      this.dateRangeError = '';
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  onSubmit(): void {
    if (!this.eventRecord) {
      return;
    }

    this.nameError = '';
    this.dateRangeError = '';
    this.eventForm.markAllAsTouched();

    if (this.eventForm.invalid) {
      return;
    }

    const value = this.eventForm.getRawValue();
    const normalizedName = this.normalizeText(value.eventName);
    const normalizedStartDateUtc = this.normalizeDateForSave(value.startDateUtc);
    const normalizedEndDateUtc = this.normalizeDateForSave(value.endDateUtc);

    if (!normalizedName) {
      this.nameError = 'Event name is required.';
      return;
    }

    if (
      normalizedStartDateUtc &&
      normalizedEndDateUtc &&
      new Date(normalizedEndDateUtc).getTime() < new Date(normalizedStartDateUtc).getTime()
    ) {
      this.dateRangeError = 'End date must be equal to or later than the start date.';
      return;
    }

    this.saved.emit({
      id: this.eventRecord.id,
      eventName: normalizedName,
      eventDescription: this.normalizeText(value.eventDescription),
      lifecycleStatus: this.normalizeLifecycleStatus(value.lifecycleStatus),
      startDateUtc: normalizedStartDateUtc,
      endDateUtc: normalizedEndDateUtc
    });
  }

  private resolveLifecycleOptions(currentLifecycle: string): string[] {
    const baseOptions = [...EDITABLE_EVENT_LIFECYCLE_STATUSES];
    if (
      DISPLAYABLE_EVENT_LIFECYCLE_STATUSES.includes(currentLifecycle as EventLifecycleStatus) &&
      !baseOptions.includes(currentLifecycle as EventLifecycleStatus)
    ) {
      return [...baseOptions, currentLifecycle];
    }

    return baseOptions;
  }

  private normalizeLifecycleStatus(value: string | undefined): string {
    const normalized = (value || '').trim().toLowerCase();
    return DISPLAYABLE_EVENT_LIFECYCLE_STATUSES.includes(normalized as EventLifecycleStatus) ? normalized : 'draft';
  }

  private normalizeText(value: string): string {
    return (value || '').trim();
  }

  private normalizeDateForSave(value: string): string | null {
    const normalized = (value || '').trim();
    if (!normalized) {
      return null;
    }

    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed.toISOString();
  }

  private toDateTimeLocalValue(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    const offset = parsed.getTimezoneOffset();
    const localDate = new Date(parsed.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 16);
  }
}
