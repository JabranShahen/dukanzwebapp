import { of, throwError } from 'rxjs';

import { AuthService } from '../auth.service';
import { AreaService } from '../services/area.service';
import { BatchService } from '../services/batch.service';
import { BatchScheduleWindow } from '../models/batch-schedule.model';
import { BatchScheduleComponent } from './batch-schedule.component';

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

describe('BatchScheduleComponent', () => {
  let authService: Pick<AuthService, 'currentRole' | 'currentAreaId'>;
  let areaService: jasmine.SpyObj<AreaService>;
  let batchService: jasmine.SpyObj<BatchService>;

  function createComponent(role: 'superadmin' | 'operator' = 'superadmin'): BatchScheduleComponent {
    authService = { currentRole: role, currentAreaId: 'area-op' };
    areaService = jasmine.createSpyObj<AreaService>('AreaService', ['getAll']);
    areaService.getAll.and.returnValue(of([{ id: 'area-1', name: 'Area 1', enabled: true }]));
    batchService = jasmine.createSpyObj<BatchService>('BatchService', ['getSchedule', 'saveSchedule']);
    batchService.getSchedule.and.returnValue(of([]));
    batchService.saveSchedule.and.returnValue(of([]));
    return new BatchScheduleComponent(
      authService as AuthService,
      areaService,
      batchService
    );
  }

  it('should render area dropdown for superadmin', () => {
    const comp = createComponent('superadmin');
    comp.ngOnInit();
    expect(comp.isSuperAdmin).toBeTrue();
    expect(areaService.getAll).toHaveBeenCalled();
    expect(comp.areas.length).toBe(1);
    expect(comp.selectedAreaId).toBe('area-1');
    expect(batchService.getSchedule).toHaveBeenCalledWith('area-1');
  });

  it('should select the first enabled area for superadmin schedule load', () => {
    const comp = createComponent('superadmin');
    areaService.getAll.and.returnValue(of([
      { id: 'area-disabled', name: 'Disabled', enabled: false },
      { id: 'area-enabled', name: 'Enabled', enabled: true }
    ]));

    comp.ngOnInit();

    expect(comp.selectedAreaId).toBe('area-enabled');
    expect(batchService.getSchedule).toHaveBeenCalledWith('area-enabled');
  });

  it('should hide area dropdown for operator and load schedule immediately', () => {
    const comp = createComponent('operator');
    batchService.getSchedule.and.returnValue(of([makeWindow()]));
    comp.ngOnInit();
    expect(comp.isSuperAdmin).toBeFalse();
    expect(areaService.getAll).not.toHaveBeenCalled();
    expect(batchService.getSchedule).toHaveBeenCalledWith('area-op');
    expect(comp.windows.length).toBe(1);
  });

  it('should display schedule windows from API', () => {
    const comp = createComponent();
    batchService.getSchedule.and.returnValue(of([makeWindow(), makeWindow({ batchIndex: 2, label: 'Evening' })]));
    comp.selectedAreaId = 'area-1';
    comp.loadSchedule();
    expect(comp.windows.length).toBe(2);
    expect(comp.windows[0].label).toBe('Morning');
  });

  it('should show empty state when no windows', () => {
    const comp = createComponent();
    batchService.getSchedule.and.returnValue(of([]));
    comp.selectedAreaId = 'area-1';
    comp.loadSchedule();
    expect(comp.windows.length).toBe(0);
  });

  it('should detect overlap and disable save', () => {
    const comp = createComponent();
    comp.windows = [
      { batchIndex: 1, label: 'A', startTimePkt: '09:00', endTimePkt: '13:00', enabled: true },
      { batchIndex: 2, label: 'B', startTimePkt: '12:00', endTimePkt: '16:00', enabled: true }
    ];
    comp.validateWindows();
    expect(comp.windows[0].overlapError).toBeTruthy();
    expect(comp.windows[1].overlapError).toBeTruthy();
    expect(comp.hasValidationErrors).toBeTrue();
  });

  it('should not flag overlap for disabled windows', () => {
    const comp = createComponent();
    comp.windows = [
      { batchIndex: 1, label: 'A', startTimePkt: '09:00', endTimePkt: '13:00', enabled: true },
      { batchIndex: 2, label: 'B', startTimePkt: '12:00', endTimePkt: '16:00', enabled: false }
    ];
    comp.validateWindows();
    expect(comp.windows[0].overlapError).toBeUndefined();
    expect(comp.hasValidationErrors).toBeFalse();
  });

  it('should detect end <= start and show error', () => {
    const comp = createComponent();
    comp.windows = [
      { batchIndex: 1, label: 'Bad', startTimePkt: '14:00', endTimePkt: '09:00', enabled: true }
    ];
    comp.validateWindows();
    expect(comp.windows[0].startEndError).toBe('End time must be after start time');
    expect(comp.hasValidationErrors).toBeTrue();
  });

  it('should call PUT on save with correct payload', () => {
    const comp = createComponent();
    const w = makeWindow();
    batchService.saveSchedule.and.returnValue(of([w]));
    comp.selectedAreaId = 'area-1';
    comp.windows = [{ ...w }];
    comp.onSave();
    expect(batchService.saveSchedule).toHaveBeenCalledWith('area-1', [
      jasmine.objectContaining({ batchIndex: 1, label: 'Morning' })
    ]);
  });

  it('should not call PUT when there are validation errors', () => {
    const comp = createComponent();
    comp.selectedAreaId = 'area-1';
    comp.windows = [
      { batchIndex: 1, label: 'A', startTimePkt: '14:00', endTimePkt: '09:00', enabled: true }
    ];
    comp.onSave();
    expect(batchService.saveSchedule).not.toHaveBeenCalled();
  });

  it('should show snackbar on save success', () => {
    const comp = createComponent();
    batchService.saveSchedule.and.returnValue(of([makeWindow()]));
    comp.selectedAreaId = 'area-1';
    comp.windows = [{ ...makeWindow() }];
    comp.onSave();
    expect(comp.feedbackMessage).toBe('Batch schedule saved.');
    expect(comp.feedbackTone).toBe('success');
  });

  it('should show error banner on API 400 with errors array', () => {
    const comp = createComponent();
    batchService.saveSchedule.and.returnValue(
      throwError(() => ({ error: { errors: ['Overlapping windows'] } }))
    );
    comp.selectedAreaId = 'area-1';
    comp.windows = [{ ...makeWindow() }];
    comp.onSave();
    expect(comp.apiError).toBe('Overlapping windows');
  });

  it('should show generic error banner on API failure without errors array', () => {
    const comp = createComponent();
    batchService.saveSchedule.and.returnValue(throwError(() => ({})));
    comp.selectedAreaId = 'area-1';
    comp.windows = [{ ...makeWindow() }];
    comp.onSave();
    expect(comp.apiError).toBe('Failed to save batch schedule.');
  });

  it('should reset to last server state on Reset click', () => {
    const comp = createComponent();
    const serverWindow = makeWindow({ label: 'Original' });
    batchService.getSchedule.and.returnValue(of([serverWindow]));
    comp.selectedAreaId = 'area-1';
    comp.loadSchedule();

    comp.windows[0].label = 'Modified';
    comp.apiError = 'some error';
    comp.onReset();

    expect(comp.windows[0].label).toBe('Original');
    expect(comp.apiError).toBe('');
  });

  it('addWindow should push a new window with next batchIndex', () => {
    const comp = createComponent();
    comp.windows = [makeWindow({ batchIndex: 3 })];
    comp.addWindow();
    expect(comp.windows.length).toBe(2);
    expect(comp.windows[1].batchIndex).toBe(4);
  });

  it('addWindow should not exceed 10 windows', () => {
    const comp = createComponent();
    comp.windows = Array.from({ length: 10 }, (_, i) => makeWindow({ batchIndex: i + 1 }));
    comp.addWindow();
    expect(comp.windows.length).toBe(10);
  });

  it('removeWindow should remove the window at the given index', () => {
    const comp = createComponent();
    comp.windows = [makeWindow({ batchIndex: 1 }), makeWindow({ batchIndex: 2 })];
    comp.removeWindow(0);
    expect(comp.windows.length).toBe(1);
    expect(comp.windows[0].batchIndex).toBe(2);
  });

  it('should treat null/missing API response as empty list (AC-12)', () => {
    const comp = createComponent();
    batchService.getSchedule.and.returnValue(of(null as unknown as BatchScheduleWindow[]));
    comp.selectedAreaId = 'area-1';
    comp.loadSchedule();
    expect(comp.windows.length).toBe(0);
  });
});
