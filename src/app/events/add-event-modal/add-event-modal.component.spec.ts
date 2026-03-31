import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { AddEventModalComponent } from './add-event-modal.component';

describe('AddEventModalComponent', () => {
  let component: AddEventModalComponent;
  let fixture: ComponentFixture<AddEventModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddEventModalComponent],
      imports: [ReactiveFormsModule],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AddEventModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('rejects whitespace-only event names', () => {
    component.eventForm.setValue({
      eventName: '   ',
      eventDescription: '',
      lifecycleStatus: 'draft',
      startDateUtc: '',
      endDateUtc: ''
    });

    component.onSubmit();

    expect(component.nameError).toBe('Event name is required.');
  });

  it('rejects invalid date ranges', () => {
    spyOn(component.saved, 'emit');
    component.eventForm.setValue({
      eventName: 'Spring Launch',
      eventDescription: '',
      lifecycleStatus: 'scheduled',
      startDateUtc: '2026-04-02T18:45',
      endDateUtc: '2026-04-01T10:30'
    });

    component.onSubmit();

    expect(component.dateRangeError).toBe('End date must be equal to or later than the start date.');
    expect(component.saved.emit).not.toHaveBeenCalled();
  });

  it('emits a trimmed payload for valid events', () => {
    spyOn(component.saved, 'emit');
    component.eventForm.setValue({
      eventName: '  Spring Launch  ',
      eventDescription: '  First seasonal window  ',
      lifecycleStatus: 'scheduled',
      startDateUtc: '2026-04-01T10:30',
      endDateUtc: '2026-04-02T18:45'
    });

    component.onSubmit();

    expect(component.saved.emit).toHaveBeenCalledWith({
      eventName: 'Spring Launch',
      eventDescription: 'First seasonal window',
      lifecycleStatus: 'scheduled',
      startDateUtc: new Date('2026-04-01T10:30').toISOString(),
      endDateUtc: new Date('2026-04-02T18:45').toISOString()
    });
  });
});
