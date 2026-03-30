import { BehaviorSubject, of } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { SettingsPageComponent } from './settings-page.component';
import { DukanzConfigService } from '../services/dukanz-config.service';
import { ResourceState } from '../services/resource-state';
import { DukanzConfig } from '../entities/dukanz-config';

class DukanzConfigServiceMock {
  readonly subject = new BehaviorSubject<ResourceState<DukanzConfig | null>>({
    status: 'ready',
    data: {
      id: 'cfg-1',
      message: 'Welcome',
      deliveryCharges: 2,
      minOrderSize: 10,
      maxOrderSize: 500,
      freeDeliveryOrderSize: 80,
      cutoffTime: '17:00',
      maxNumberOfActiveOrders: 20,
      minOrderActiveScreenPresenseHours: 4,
      maxNumberOfHistoryOrders: 200,
      contactPhoneNumber: '+44000000000',
    },
  });
  readonly state$ = this.subject.asObservable();

  loadCalls = 0;
  updateCalls = 0;

  load(): void {
    this.loadCalls += 1;
  }

  initialize() {
    return of({});
  }

  update() {
    this.updateCalls += 1;
    return of({});
  }
}

describe('SettingsPageComponent', () => {
  let fixture: ComponentFixture<SettingsPageComponent>;
  let service: DukanzConfigServiceMock;

  beforeEach(async () => {
    service = new DukanzConfigServiceMock();

    await TestBed.configureTestingModule({
      imports: [SettingsPageComponent],
      providers: [
        { provide: DukanzConfigService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                pageTitle: 'Platform settings',
                pageBody: 'Manage Dukanz config',
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsPageComponent);
    fixture.detectChanges();
  });

  it('renders editable form when config is ready', () => {
    expect(fixture.nativeElement.textContent).toContain('Save changes');
    expect(fixture.nativeElement.querySelector('textarea[formControlName="message"]')).not.toBeNull();
  });

  it('saves changes through update flow', () => {
    const messageInput = fixture.nativeElement.querySelector('textarea[formControlName="message"]') as HTMLTextAreaElement;
    messageInput.value = 'Updated message';
    messageInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;
    const saveButton = Array.from(buttons).find((button) => button.textContent?.includes('Save changes')) as HTMLButtonElement;

    expect(saveButton.disabled).toBe(false);

    saveButton.click();
    fixture.detectChanges();

    expect(service.updateCalls).toBe(1);
  });
});
