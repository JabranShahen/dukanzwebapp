import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { AuthService } from '../auth.service';
import { ClaimAdminSummary, ClaimDetail } from '../models/claim.model';
import { ClaimService } from '../services/claim.service';
import { ClaimsManagementComponent } from './claims-management.component';

describe('ClaimsManagementComponent', () => {
  let component: ClaimsManagementComponent;
  let fixture: ComponentFixture<ClaimsManagementComponent>;
  let claimService: jasmine.SpyObj<ClaimService>;
  let authService: Pick<AuthService, 'currentRole' | 'currentAreaId'>;

  const claim: ClaimAdminSummary = {
    claimId: 'claim-123456',
    orderId: 'order-1',
    areaId: 'area-a',
    customerName: 'Customer One',
    customerPhoneNumber: '03001234567',
    status: 'Submitted',
    issueTypes: ['Expired'],
    itemCount: 1,
    attachmentCount: 1,
    createdAtUtc: '2026-06-10T10:00:00Z',
    ageHours: 2
  };

  const detail: ClaimDetail = {
    claimId: claim.claimId,
    orderId: claim.orderId,
    areaId: claim.areaId,
    customerPhoneNumber: claim.customerPhoneNumber,
    status: 'Submitted',
    items: [{
      orderItemId: 'item-1',
      productId: 'product-1',
      productName: 'Milk',
      issueType: 'Expired',
      quantityClaimed: 1,
      description: 'Expired date.'
    }],
    attachments: [{
      attachmentId: 'att-1',
      orderItemId: 'item-1',
      fileName: 'milk.jpg',
      contentType: 'image/jpeg',
      sizeBytes: 1024,
      blobPath: 'claims/area-a/order-1/milk.jpg'
    }],
    statusHistory: [{
      status: 'Submitted',
      timestampUtc: '2026-06-10T10:00:00Z',
      changedBy: '03001234567',
      changedByRole: 'customer'
    }],
    resolution: null
  };

  beforeEach(async () => {
    claimService = jasmine.createSpyObj<ClaimService>('ClaimService', ['getClaims', 'getClaim', 'updateStatus']);
    authService = { currentRole: 'operator', currentAreaId: 'area-a' };

    claimService.getClaims.and.returnValue(of({ totalCount: 1, claims: [claim] }));
    claimService.getClaim.and.returnValue(of(detail));
    claimService.updateStatus.and.returnValue(of({
      claimId: claim.claimId,
      status: 'Approved',
      updatedAtUtc: '2026-06-10T11:00:00Z'
    }));

    await TestBed.configureTestingModule({
      declarations: [ClaimsManagementComponent],
      imports: [FormsModule],
      providers: [
        { provide: ClaimService, useValue: claimService },
        { provide: AuthService, useValue: authService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ClaimsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the operator claim queue and shows area scoping text', () => {
    expect(claimService.getClaims).toHaveBeenCalledWith(jasmine.objectContaining({ areaId: undefined }));
    expect(component.claims).toEqual([claim]);
    expect(fixture.nativeElement.textContent).toContain('Area area-a');
  });

  it('applies SuperAdmin area filters to the list query', () => {
    authService.currentRole = 'superadmin';
    component.areaIdFilter = 'area-b';
    component.applyFilters();

    expect(claimService.getClaims).toHaveBeenCalledWith(jasmine.objectContaining({ areaId: 'area-b' }));
  });

  it('lazy-loads signed attachment URLs only after preview request', () => {
    component.openClaim(claim);
    expect(claimService.getClaim).toHaveBeenCalledWith('claim-123456', false);

    component.loadPhotoPreviews();
    expect(claimService.getClaim).toHaveBeenCalledWith('claim-123456', true);
  });

  it('confirms and patches approval actions with resolution metadata', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.openClaim(claim);
    component.internalNote = 'Refund approved.';
    component.resolutionAmount = '120';

    const refundAction = component.getActions().find((action) => action.label === 'Approve refund');
    expect(refundAction).toBeDefined();
    component.applyAction(refundAction!);

    expect(window.confirm).toHaveBeenCalled();
    expect(claimService.updateStatus).toHaveBeenCalledWith('claim-123456', jasmine.objectContaining({
      status: 'Approved',
      note: 'Refund approved.',
      reasonCode: 'Expired',
      resolution: jasmine.objectContaining({
        type: 'Refund',
        amount: 120,
        currency: 'PKR'
      })
    }));
  });

  it('requires a note before SuperAdmin terminal override', () => {
    authService.currentRole = 'superadmin';
    component.openClaim({ ...claim, status: 'Resolved' });
    component.selectedDetail = { ...detail, status: 'Resolved' };

    const reopenAction = component.getActions().find((action) => action.status === 'Reopened');
    expect(reopenAction).toBeDefined();
    component.applyAction(reopenAction!);

    expect(claimService.updateStatus).not.toHaveBeenCalled();
    expect(component.feedbackTone).toBe('error');
  });

  it('shows update errors as snackbar feedback', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    claimService.updateStatus.and.returnValue(throwError(() => ({
      error: { code: 'InvalidStatusTransition', message: 'Claim was updated. Refresh and try again.' }
    })));
    component.openClaim(claim);

    const rejectAction = component.getActions().find((action) => action.label === 'Reject');
    component.applyAction(rejectAction!);

    expect(component.feedbackTone).toBe('error');
    expect(component.feedbackMessage).toContain('Refresh and try again');
  });
});
