import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { ManagementHeaderComponent } from '../shared/management-header/management-header.component';
import { ManagementPanelComponent } from '../shared/management-panel/management-panel.component';
import { ConfirmDialogComponent } from '../shared/ui/confirm-dialog/confirm-dialog.component';
import { UiButtonComponent } from '../shared/ui/ui-button/ui-button.component';
import { UiSnackbarComponent } from '../shared/ui/ui-snackbar/ui-snackbar.component';
import { DataUpdatesService } from '../services/data-updates.service';
import { DataUpdatesComponent } from './data-updates.component';

describe('DataUpdatesComponent', () => {
  let component: DataUpdatesComponent;
  let fixture: ComponentFixture<DataUpdatesComponent>;
  let dataUpdatesService: jasmine.SpyObj<DataUpdatesService>;

  beforeEach(async () => {
    dataUpdatesService = jasmine.createSpyObj<DataUpdatesService>('DataUpdatesService', ['resetPurchase']);
    dataUpdatesService.resetPurchase.and.returnValue(of({ scannedOrderCount: 10, updatedOrderCount: 4 }));

    await TestBed.configureTestingModule({
      declarations: [
        DataUpdatesComponent,
        ManagementHeaderComponent,
        ManagementPanelComponent,
        UiButtonComponent,
        ConfirmDialogComponent,
        UiSnackbarComponent
      ],
      providers: [
        { provide: DataUpdatesService, useValue: dataUpdatesService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DataUpdatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the page header and reset purchase action', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Data Updates');
    expect(text).toContain('Reset purchase');
  });

  it('opens a destructive confirmation before calling the service', () => {
    component.openResetConfirmation();
    fixture.detectChanges();

    expect(component.showResetConfirmation).toBeTrue();
    expect(dataUpdatesService.resetPurchase).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Reset purchase data?');
    expect(fixture.nativeElement.textContent).toContain('purchase status and purchase history');
  });

  it('does not call the service when confirmation is cancelled', () => {
    component.openResetConfirmation();
    component.cancelReset();

    expect(component.showResetConfirmation).toBeFalse();
    expect(dataUpdatesService.resetPurchase).not.toHaveBeenCalled();
  });

  it('calls the service once after confirmation and shows the updated count', () => {
    component.openResetConfirmation();
    component.confirmReset();

    expect(dataUpdatesService.resetPurchase).toHaveBeenCalledTimes(1);
    expect(component.showResetConfirmation).toBeFalse();
    expect(component.resetting).toBeFalse();
    expect(component.feedbackTone).toBe('success');
    expect(component.feedbackMessage).toBe('Purchase reset complete. 4 orders updated.');
  });

  it('keeps the action disabled while the reset is pending', () => {
    const pending = new Subject<{ scannedOrderCount: number; updatedOrderCount: number }>();
    dataUpdatesService.resetPurchase.and.returnValue(pending.asObservable());

    component.openResetConfirmation();
    component.confirmReset();
    fixture.detectChanges();

    expect(component.resetting).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Resetting...');

    pending.next({ scannedOrderCount: 5, updatedOrderCount: 2 });
    pending.complete();
    fixture.detectChanges();

    expect(component.resetting).toBeFalse();
  });

  it('shows an error and re-enables the action when reset fails', () => {
    dataUpdatesService.resetPurchase.and.returnValue(throwError(() => new Error('network')));

    component.openResetConfirmation();
    component.confirmReset();

    expect(component.resetting).toBeFalse();
    expect(component.showResetConfirmation).toBeFalse();
    expect(component.feedbackTone).toBe('error');
    expect(component.feedbackMessage).toBe('Failed to reset purchase data.');
  });
});
