import { of } from 'rxjs';

import { ApiService } from './api.service';
import { BatchService } from './batch.service';
import { BatchScheduleWindow } from '../models/batch-schedule.model';

function makeWindow(overrides: Partial<BatchScheduleWindow> = {}): BatchScheduleWindow {
  return {
    batchIndex: 1,
    label: 'Morning',
    startTimePkt: '09:00',
    endTimePkt: '13:00',
    enabled: true,
    ...overrides
  };
}

describe('BatchService', () => {
  let service: BatchService;
  let api: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<ApiService>('ApiService', ['get', 'put']);
    service = new BatchService(api);
  });

  it('getSchedule should call GET batch/schedule/{areaId}', () => {
    const windows = [makeWindow()];
    api.get.and.returnValue(of(windows));

    let result: BatchScheduleWindow[] = [];
    service.getSchedule('area-1').subscribe((w) => (result = w));

    expect(api.get).toHaveBeenCalledWith('batch/schedule/area-1');
    expect(result).toEqual(windows);
  });

  it('getSchedule should encode areaId path segment', () => {
    api.get.and.returnValue(of([]));

    service.getSchedule('Area 1/North').subscribe();

    expect(api.get).toHaveBeenCalledWith('batch/schedule/Area%201%2FNorth');
  });

  it('getSchedule returns empty array when API returns null', () => {
    api.get.and.returnValue(of(null));

    let result: BatchScheduleWindow[] = [makeWindow()];
    service.getSchedule('area-1').subscribe((w) => (result = w));

    expect(result).toEqual([]);
  });

  it('saveSchedule should call PUT batch/schedule/{areaId} with payload', () => {
    const windows = [makeWindow()];
    api.put.and.returnValue(of(windows));

    let result: BatchScheduleWindow[] = [];
    service.saveSchedule('area-1', windows).subscribe((w) => (result = w));

    expect(api.put).toHaveBeenCalledWith('batch/schedule/area-1', windows);
    expect(result).toEqual(windows);
  });

  it('saveSchedule should encode areaId path segment', () => {
    const windows = [makeWindow()];
    api.put.and.returnValue(of(windows));

    service.saveSchedule('Area 1/North', windows).subscribe();

    expect(api.put).toHaveBeenCalledWith('batch/schedule/Area%201%2FNorth', windows);
  });
});
