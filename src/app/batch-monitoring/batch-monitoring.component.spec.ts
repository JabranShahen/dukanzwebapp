import { FormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { AreaService } from '../services/area.service';
import { SharedUiModule } from '../shared/shared-ui.module';
import {
  BatchMonitoringResult,
  BatchMonitoringService,
  BatchSlotRow
} from './batch-monitoring.service';
import { BatchMonitoringComponent, todayPakistanDateKey } from './batch-monitoring.component';

function makeRow(overrides: Partial<BatchSlotRow> = {}): BatchSlotRow {
  return {
    batchIndex: 1,
    batchId: 'area-1-2026-08-16-1',
    label: 'Morning',
    windowTimes: '9:00 AM - 1:00 PM',
    counts: {
      approved: 0,
      processing: 0,
      packed: 0,
      dispatched: 0,
      delivered: 0,
      cancelled: 0
    },
    total: 0,
    enabled: true,
    isUnbatched: false,
    hasActualRecord: false,
    ...overrides
  };
}

function makeResult(overrides: Partial<BatchMonitoringResult> = {}): BatchMonitoringResult {
  return {
    schedule: [
      { batchIndex: 1, label: 'Morning', startTimePkt: '09:00', endTimePkt: '13:00', enabled: true }
    ],
    records: [],
    orders: [],
    rows: [makeRow()],
    ...overrides
  };
}

describe('BatchMonitoringComponent', () => {
  let areaService: jasmine.SpyObj<AreaService>;
  let monitoringService: jasmine.SpyObj<BatchMonitoringService>;

  beforeEach(async () => {
    areaService = jasmine.createSpyObj<AreaService>('AreaService', ['getAll']);
    areaService.getAll.and.returnValue(of([
      { id: 'area-disabled', name: 'Disabled Area', enabled: false },
      { id: 'area-1', name: 'Area 1', enabled: true },
      { id: 'area-2', name: 'Area 2', enabled: true }
    ]));

    monitoringService = jasmine.createSpyObj<BatchMonitoringService>('BatchMonitoringService', ['loadMonitoring']);
    monitoringService.loadMonitoring.and.returnValue(of(makeResult()));

    await TestBed.configureTestingModule({
      imports: [FormsModule, RouterTestingModule, SharedUiModule],
      declarations: [BatchMonitoringComponent],
      providers: [
        { provide: AreaService, useValue: areaService },
        { provide: BatchMonitoringService, useValue: monitoringService }
      ]
    }).compileComponents();
  });

  it('defaults date to today in PKT', () => {
    const lateUtc = new Date(Date.UTC(2026, 7, 15, 20, 0, 0));

    expect(todayPakistanDateKey(lateUtc)).toBe('2026-08-16');
  });

  it('should display area dropdown and date picker on load', () => {
    const fixture = TestBed.createComponent(BatchMonitoringComponent);
    fixture.detectChanges();

    const native = fixture.nativeElement as HTMLElement;
    expect(native.querySelector('select')).not.toBeNull();
    expect(native.querySelector('input[type="date"]')).not.toBeNull();
    expect(componentText(native)).toContain('Batch Monitoring');
  });

  it('auto-selects the first enabled area and loads monitoring data', () => {
    const fixture = TestBed.createComponent(BatchMonitoringComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.selectedAreaId).toBe('area-1');
    expect(monitoringService.loadMonitoring).toHaveBeenCalledWith('area-1', component.selectedDate);
  });

  it('should call service on area and date change', () => {
    const fixture = TestBed.createComponent(BatchMonitoringComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    monitoringService.loadMonitoring.calls.reset();

    component.selectedAreaId = 'area-2';
    component.onAreaChange();
    expect(monitoringService.loadMonitoring).toHaveBeenCalledWith('area-2', component.selectedDate);

    monitoringService.loadMonitoring.calls.reset();
    component.selectedDate = '2026-08-15';
    component.onDateChange();
    expect(monitoringService.loadMonitoring).toHaveBeenCalledWith('area-2', '2026-08-15');
  });

  it('should show empty-state when no schedule', () => {
    monitoringService.loadMonitoring.and.returnValue(of(makeResult({ schedule: [], rows: [] })));
    const fixture = TestBed.createComponent(BatchMonitoringComponent);
    fixture.detectChanges();

    expect(componentText(fixture.nativeElement)).toContain('No batch schedule configured for this area');
  });

  it('should show unbatched row only when unbatched orders exist', () => {
    monitoringService.loadMonitoring.and.returnValue(of(makeResult({
      rows: [
        makeRow({ total: 0 }),
        makeRow({
          batchIndex: null,
          batchId: null,
          label: 'Unbatched',
          windowTimes: '-',
          total: 1,
          counts: {
            approved: 1,
            processing: 0,
            packed: 0,
            dispatched: 0,
            delivered: 0,
            cancelled: 0
          },
          isUnbatched: true
        })
      ]
    })));

    const fixture = TestBed.createComponent(BatchMonitoringComponent);
    fixture.detectChanges();

    expect(componentText(fixture.nativeElement)).toContain('Unbatched');
  });

  it('should show zero-count row for empty batch slots', () => {
    monitoringService.loadMonitoring.and.returnValue(of(makeResult({ rows: [makeRow({ total: 0 })] })));
    const fixture = TestBed.createComponent(BatchMonitoringComponent);
    fixture.detectChanges();

    const native = fixture.nativeElement as HTMLElement;
    expect(componentText(native)).toContain('Morning');
    expect(componentText(native)).toContain('0');
  });

  it('should grey disabled batch windows', () => {
    monitoringService.loadMonitoring.and.returnValue(of(makeResult({
      rows: [makeRow({ label: 'Evening', enabled: false })]
    })));
    const fixture = TestBed.createComponent(BatchMonitoringComponent);
    fixture.detectChanges();

    const disabledRow = (fixture.nativeElement as HTMLElement).querySelector('tbody tr.row--disabled');
    expect(disabledRow).not.toBeNull();
    expect(disabledRow?.textContent).toContain('Evening');
    expect(disabledRow?.textContent).toContain('Disabled');
  });

  it('shows snackbar message on API error', () => {
    monitoringService.loadMonitoring.and.returnValue(throwError(() => ({ status: 500 })));
    const fixture = TestBed.createComponent(BatchMonitoringComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.feedbackTone).toBe('error');
    expect(component.feedbackMessage).toBe('Failed to load batch monitoring data.');
  });
});

function componentText(native: Element): string {
  return (native.textContent || '').replace(/\s+/g, ' ').trim();
}
