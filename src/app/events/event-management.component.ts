import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { EventMutation, EventRecord } from '../models/event.model';
import { BlobStorageService } from '../services/blob-storage.service';
import { EventService } from '../services/event.service';

@Component({
  selector: 'app-event-management',
  templateUrl: './event-management.component.html',
  styleUrls: ['./event-management.component.scss']
})
export class EventManagementComponent implements OnInit {
  loading = true;
  error = '';
  mutationPending = false;
  feedbackMessage = '';
  feedbackTone: 'success' | 'error' = 'success';
  addModalOpen = false;
  editModalOpen = false;
  selectedEvent: EventRecord | null = null;
  events: EventRecord[] = [];
  eventImageUrls: Record<string, string> = {};

  constructor(
    private readonly eventService: EventService,
    private readonly router: Router,
    private readonly blobStorageService: BlobStorageService
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.eventImageUrls = {};

    this.eventService.getAll().subscribe({
      next: (events) => {
        this.events = [...events].sort((left, right) => this.compareEvents(left, right));
        this.hydrateEventImages(this.events);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load event containers from the Event endpoint.';
      }
    });
  }

  openAddModal(): void {
    this.addModalOpen = true;
    this.feedbackMessage = '';
  }

  closeAddModal(): void {
    if (!this.mutationPending) {
      this.addModalOpen = false;
    }
  }

  openEditModal(eventRecord: EventRecord): void {
    this.selectedEvent = { ...eventRecord };
    this.editModalOpen = true;
    this.feedbackMessage = '';
  }

  openCategoryManagement(eventRecord: EventRecord): void {
    this.router.navigate(['/dashboard/events'], {
      queryParams: {
        event: eventRecord.id
      }
    });
  }

  closeEditModal(): void {
    if (!this.mutationPending) {
      this.editModalOpen = false;
      this.selectedEvent = null;
    }
  }

  onAddEvent(payload: EventMutation): void {
    this.mutationPending = true;
    this.resolveEventImagePath(payload).pipe(
      switchMap((imageURL) => this.eventService.create({
        ...payload,
        imageURL
      }))
    ).subscribe({
      next: () => {
        this.mutationPending = false;
        this.addModalOpen = false;
        this.setFeedback('success', 'Event container created.');
        this.reload();
      },
      error: () => {
        this.mutationPending = false;
        this.setFeedback('error', 'Failed to create event container.');
      }
    });
  }

  onEditEvent(payload: EventMutation): void {
    this.mutationPending = true;
    this.resolveEventImagePath(payload).pipe(
      switchMap((imageURL) => this.eventService.update({
        ...payload,
        imageURL
      }))
    ).subscribe({
      next: () => {
        this.mutationPending = false;
        this.editModalOpen = false;
        this.selectedEvent = null;
        this.setFeedback('success', 'Event container updated.');
        this.reload();
      },
      error: () => {
        this.mutationPending = false;
        this.setFeedback('error', 'Failed to update event container.');
      }
    });
  }

  eventCountLabel(): string {
    const count = this.events.length;
    return `${count} ${count === 1 ? 'event' : 'events'}`;
  }

  lifecycleLabel(eventRecord: EventRecord): string {
    const value = (eventRecord.lifecycleStatus || '').trim().toLowerCase();
    if (!value) {
      return 'Draft';
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  lifecycleTone(eventRecord: EventRecord): 'success' | 'muted' {
    const value = (eventRecord.lifecycleStatus || '').trim().toLowerCase();
    return value === 'scheduled' || value === 'live' ? 'success' : 'muted';
  }

  scheduleSummary(eventRecord: EventRecord): string {
    const start = this.formatUtcDate(eventRecord.startDateUtc);
    const end = this.formatUtcDate(eventRecord.endDateUtc);

    if (start && end) {
      return `${start} to ${end}`;
    }

    if (start) {
      return `Starts ${start}`;
    }

    if (end) {
      return `Ends ${end}`;
    }

    return 'No schedule window set';
  }

  scopeSummary(eventRecord: EventRecord): string {
    if (eventRecord.lifecycleStatus === 'live' || eventRecord.lifecycleStatus === 'closed') {
      return 'Display only. Launch and close behavior land in Story 2.5.';
    }

    return 'Metadata stays here. Category and product composition now live in the dedicated event-composition flow.';
  }

  eventImageUrl(eventRecord: EventRecord): string {
    return this.eventImageUrls[eventRecord.id] || '';
  }

  eventImageStatus(eventRecord: EventRecord): string {
    if (this.eventImageUrl(eventRecord)) {
      return 'Image loaded';
    }

    return eventRecord.imageURL ? 'Image stored' : 'No image';
  }

  trackById(_index: number, item: EventRecord): string {
    return item.id;
  }

  private compareEvents(left: EventRecord, right: EventRecord): number {
    const leftDate = left.startDateUtc ? new Date(left.startDateUtc).getTime() : Number.MAX_SAFE_INTEGER;
    const rightDate = right.startDateUtc ? new Date(right.startDateUtc).getTime() : Number.MAX_SAFE_INTEGER;

    if (leftDate !== rightDate) {
      return leftDate - rightDate;
    }

    return (left.eventName || '').localeCompare(right.eventName || '', undefined, { sensitivity: 'base' });
  }

  private setFeedback(tone: 'success' | 'error', message: string): void {
    this.feedbackTone = tone;
    this.feedbackMessage = message;
  }

  private hydrateEventImages(events: EventRecord[]): void {
    for (const eventRecord of events) {
      const imagePath = (eventRecord.imageURL || '').trim();
      if (!imagePath) {
        this.eventImageUrls[eventRecord.id] = '';
        continue;
      }

      this.blobStorageService.getDownloadUrl(imagePath).subscribe({
        next: (imageUrl) => {
          this.eventImageUrls[eventRecord.id] = imageUrl || '';
        },
        error: () => {
          this.eventImageUrls[eventRecord.id] = '';
        }
      });
    }
  }

  private resolveEventImagePath(payload: EventMutation): Observable<string> {
    if (payload.clearImage) {
      return of('');
    }

    if (payload.imageFile) {
      return this.blobStorageService.uploadImage(payload.imageFile, 'dukanz/events');
    }

    return of((payload.imageURL || '').trim());
  }

  private formatUtcDate(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    return parsed.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
      timeZoneName: 'short'
    });
  }
}
