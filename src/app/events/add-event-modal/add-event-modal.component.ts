import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { EDITABLE_EVENT_LIFECYCLE_STATUSES, EventLifecycleStatus, EventMutation } from '../../models/event.model';

@Component({
  selector: 'app-add-event-modal',
  templateUrl: './add-event-modal.component.html',
  styleUrls: ['./add-event-modal.component.scss']
})
export class AddEventModalComponent {
  @Input() pending = false;
  @Output() cancelled = new EventEmitter<void>();
  @Output() saved = new EventEmitter<EventMutation>();

  nameError = '';
  dateRangeError = '';

  readonly lifecycleOptions = EDITABLE_EVENT_LIFECYCLE_STATUSES;
  readonly eventForm = this.formBuilder.nonNullable.group({
    eventName: ['', [Validators.required, Validators.maxLength(120)]],
    eventDescription: ['', [Validators.maxLength(500)]],
    lifecycleStatus: ['draft' as EventLifecycleStatus, [Validators.required]],
    startDateUtc: [''],
    endDateUtc: ['']
  });

  constructor(private readonly formBuilder: FormBuilder) {}

  onCancel(): void {
    this.cancelled.emit();
  }

  onSubmit(): void {
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
      eventName: normalizedName,
      eventDescription: this.normalizeText(value.eventDescription),
      lifecycleStatus: value.lifecycleStatus,
      startDateUtc: normalizedStartDateUtc,
      endDateUtc: normalizedEndDateUtc
    });
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
}
