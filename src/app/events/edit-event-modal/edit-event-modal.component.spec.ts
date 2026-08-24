import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { EditEventModalComponent } from './edit-event-modal.component';
import { BlobStorageService } from '../../services/blob-storage.service';

describe('EditEventModalComponent', () => {
  let component: EditEventModalComponent;
  let fixture: ComponentFixture<EditEventModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditEventModalComponent],
      imports: [ReactiveFormsModule],
      providers: [
        {
          provide: BlobStorageService,
          useValue: {
            getDownloadUrl: () => of('https://img.test/event.png')
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EditEventModalComponent);
    component = fixture.componentInstance;
    component.eventRecord = {
      id: 'event-1',
      eventName: 'Spring Launch',
      eventDescription: 'First seasonal window',
      imageURL: 'dukanz/events/spring-launch.png',
      lifecycleStatus: 'live',
      startDateUtc: '2026-04-01T10:30:00.000Z',
      endDateUtc: '2026-04-02T18:45:00.000Z'
    };
    component.ngOnChanges({
      eventRecord: new SimpleChange(null, component.eventRecord, true)
    });
    fixture.detectChanges();
  });

  it('preserves later lifecycle values so they can still be displayed safely', () => {
    expect(component.lifecycleOptions).toEqual(['draft', 'scheduled', 'live']);
    expect(component.eventForm.getRawValue().lifecycleStatus).toBe('live');
  });

  it('rejects invalid date ranges during edit', () => {
    component.eventForm.patchValue({
      endDateUtc: '2026-03-31T10:30'
    });

    component.onSubmit();

    expect(component.dateRangeError).toBe('End date must be equal to or later than the start date.');
  });

  it('emits the edited event payload with normalized values', () => {
    spyOn(component.saved, 'emit');
    component.eventForm.patchValue({
      eventName: '  Spring Refresh  ',
      lifecycleStatus: 'draft'
    });

    component.onSubmit();

    expect(component.saved.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      id: 'event-1',
      eventName: 'Spring Refresh',
      imageURL: 'dukanz/events/spring-launch.png',
      imageFile: null,
      clearImage: false,
      lifecycleStatus: 'draft'
    }));
  });
});
