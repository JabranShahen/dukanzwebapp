import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementHeaderComponent } from './management-header.component';

describe('ManagementHeaderComponent', () => {
  let fixture: ComponentFixture<ManagementHeaderComponent>;
  let component: ManagementHeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ManagementHeaderComponent);
    component = fixture.componentInstance;
    component.title = 'Dashboard';
    component.ctaLabel = 'Refresh';
    fixture.detectChanges();
  });

  it('renders the supplied title', () => {
    expect(fixture.nativeElement.textContent).toContain('Dashboard');
  });

  it('emits when the CTA is clicked', () => {
    let emitted = false;
    component.ctaClick.subscribe(() => {
      emitted = true;
    });

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(emitted).toBe(true);
  });
});
