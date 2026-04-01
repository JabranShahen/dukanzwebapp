import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { EventService } from './event.service';
import { environment } from '../environments/environment';

describe('EventService', () => {
  let service: EventService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(EventService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('maps null event lists to an empty array', () => {
    let resultLength = -1;

    service.getAll().subscribe((events) => {
      resultLength = events.length;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/Event`);
    request.flush(null);

    expect(resultLength).toBe(0);
  });

  it('creates an event with trimmed fields and normalized lifecycle or date payloads', () => {
    let result: unknown;

    service.create({
      eventName: '  Spring Launch  ',
      eventDescription: '  First seasonal window  ',
      imageURL: '  dukanz/events/spring-launch.png  ',
      lifecycleStatus: '  SCHEDULED  ',
      startDateUtc: '2026-04-01T10:30:00Z',
      endDateUtc: '2026-04-02T18:45:00Z'
    }).subscribe((eventRecord) => {
      result = eventRecord;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/Event`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.eventName).toBe('Spring Launch');
    expect(request.request.body.eventDescription).toBe('First seasonal window');
    expect(request.request.body.imageURL).toBe('dukanz/events/spring-launch.png');
    expect(request.request.body.lifecycleStatus).toBe('scheduled');
    expect(request.request.body.startDateUtc).toBe('2026-04-01T10:30:00.000Z');
    expect(request.request.body.endDateUtc).toBe('2026-04-02T18:45:00.000Z');
    expect(request.request.body.PartitionKey).toBe(request.request.body.id);

    request.flush({ id: 'event-1' });

    expect(result).toEqual(jasmine.objectContaining({
      id: 'event-1',
      eventName: 'Spring Launch',
      imageURL: 'dukanz/events/spring-launch.png',
      lifecycleStatus: 'scheduled',
      startDateUtc: '2026-04-01T10:30:00.000Z',
      endDateUtc: '2026-04-02T18:45:00.000Z'
    }));
  });

  it('getActive calls GET Event/active and returns normalized event records', () => {
    let results: unknown[] = [];

    service.getActive().subscribe((events) => {
      results = events;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/Event/active`);
    expect(request.request.method).toBe('GET');
    request.flush([{ id: 'ev-1', eventName: 'Live Event', lifecycleStatus: 'live' }]);

    expect(results.length).toBe(1);
    expect((results[0] as { lifecycleStatus: string }).lifecycleStatus).toBe('live');
  });

  it('getActive returns empty array when response is null', () => {
    let results: unknown[] = [{ id: 'dummy' }];

    service.getActive().subscribe((events) => {
      results = events;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/Event/active`);
    request.flush(null);

    expect(results.length).toBe(0);
  });

  it('launch calls POST Event/{id}/launch with empty body', () => {
    let result: unknown;

    service.launch('ev-1').subscribe((response) => {
      result = response;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/Event/ev-1/launch`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush({ id: 'ev-1', launched: true, lifecycleStatus: 'live' });

    expect((result as { launched: boolean }).launched).toBeTrue();
  });

  it('close calls POST Event/{id}/close with empty body', () => {
    let result: unknown;

    service.close('ev-1').subscribe((response) => {
      result = response;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/Event/ev-1/close`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush({ id: 'ev-1', closed: true, lifecycleStatus: 'closed' });

    expect((result as { closed: boolean }).closed).toBeTrue();
  });

  it('returns false when the delete endpoint reports that the event was not deleted', () => {
    let deleted: boolean | undefined;

    service.delete('event-1').subscribe((result) => {
      deleted = result;
    });

    const request = httpMock.expectOne(`${environment.apiBaseUrl}/Event/event-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush({ deleted: false, reason: 'Event is still referenced.' });

    expect(deleted).toBeFalse();
  });
});
