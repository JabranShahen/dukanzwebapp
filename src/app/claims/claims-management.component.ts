import { Component, OnInit } from '@angular/core';

import { AuthService } from '../auth.service';
import {
  ClaimAdminSummary,
  ClaimDetail,
  ClaimIssueType,
  ClaimListFilters,
  ClaimStatus
} from '../models/claim.model';
import { ClaimService } from '../services/claim.service';

interface ClaimAction {
  label: string;
  status: ClaimStatus;
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  resolutionType?: string;
  confirm: boolean;
  requiresNote?: boolean;
}

@Component({
  selector: 'app-claims-management',
  templateUrl: './claims-management.component.html',
  styleUrls: ['./claims-management.component.scss']
})
export class ClaimsManagementComponent implements OnInit {
  claims: ClaimAdminSummary[] = [];
  selectedClaim: ClaimAdminSummary | null = null;
  selectedDetail: ClaimDetail | null = null;

  statusOptions = ['', 'Submitted', 'UnderReview', 'NeedsInfo', 'Approved', 'Rejected', 'Resolved', 'Reopened'];
  issueOptions: Array<'' | ClaimIssueType> = ['', 'Faulty', 'Expired', 'Incomplete'];
  searchMode: 'orderId' | 'customerPhone' = 'orderId';
  statusFilter = '';
  issueTypeFilter = '';
  areaIdFilter = '';
  searchTerm = '';
  fromDate = '';
  toDate = '';

  loading = false;
  detailLoading = false;
  updating = false;
  error = '';
  detailError = '';
  feedbackMessage = '';
  feedbackTone: 'success' | 'error' = 'success';

  internalNote = '';
  resolutionAmount = '';
  resolutionReferenceId = '';

  constructor(
    public readonly authService: AuthService,
    private readonly claimService: ClaimService
  ) {}

  ngOnInit(): void {
    this.loadClaims();
  }

  loadClaims(): void {
    this.loading = true;
    this.error = '';

    this.claimService.getClaims(this.buildFilters()).subscribe({
      next: (response) => {
        this.loading = false;
        this.claims = response.claims;
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load claims.';
      }
    });
  }

  applyFilters(): void {
    this.selectedClaim = null;
    this.selectedDetail = null;
    this.loadClaims();
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.issueTypeFilter = '';
    this.areaIdFilter = '';
    this.searchTerm = '';
    this.fromDate = '';
    this.toDate = '';
    this.searchMode = 'orderId';
    this.applyFilters();
  }

  openClaim(claim: ClaimAdminSummary): void {
    this.selectedClaim = claim;
    this.selectedDetail = null;
    this.detailError = '';
    this.internalNote = '';
    this.resolutionAmount = '';
    this.resolutionReferenceId = '';
    this.loadClaimDetail(false);
  }

  closeDetail(): void {
    this.selectedClaim = null;
    this.selectedDetail = null;
    this.detailError = '';
  }

  loadPhotoPreviews(): void {
    this.loadClaimDetail(true);
  }

  applyAction(action: ClaimAction): void {
    if (!this.selectedClaim || !this.selectedDetail || this.updating) return;

    const note = this.internalNote.trim();
    if (action.requiresNote && !note) {
      this.showFeedback('Add an internal note before this override.', 'error');
      return;
    }

    if (action.confirm && !window.confirm(`Set claim ${this.shortId(this.selectedClaim.claimId)} to ${this.displayStatus(action.status)}?`)) {
      return;
    }

    this.updating = true;
    this.claimService.updateStatus(this.selectedClaim.claimId, {
      status: action.status,
      note: note || null,
      reasonCode: this.primaryIssueType(this.selectedDetail),
      resolution: action.resolutionType
        ? {
            type: action.resolutionType,
            amount: this.parseAmount(),
            currency: 'PKR',
            referenceId: this.resolutionReferenceId.trim() || null,
            notes: note || null
          }
        : null
    }).subscribe({
      next: (response) => {
        this.updating = false;
        this.showFeedback(`Claim ${this.shortId(response.claimId)} updated to ${this.displayStatus(response.status)}.`, 'success');
        this.loadClaims();
        this.loadClaimDetail(false);
      },
      error: (error) => {
        this.updating = false;
        const message = error?.error?.message || error?.error?.code || 'Failed to update claim.';
        this.showFeedback(message, 'error');
      }
    });
  }

  getActions(): ClaimAction[] {
    const status = this.selectedDetail?.status || this.selectedClaim?.status || '';
    const actions: ClaimAction[] = [];

    if (['Submitted', 'NeedsInfo', 'Reopened'].includes(status)) {
      actions.push({ label: 'Start review', status: 'UnderReview', variant: 'primary', confirm: false });
    }

    if (['Submitted', 'UnderReview', 'Reopened'].includes(status)) {
      actions.push({ label: 'Need info', status: 'NeedsInfo', variant: 'secondary', confirm: false });
    }

    if (['Submitted', 'UnderReview', 'NeedsInfo', 'Reopened'].includes(status)) {
      actions.push(
        { label: 'Approve replacement', status: 'Approved', variant: 'primary', resolutionType: 'Replacement', confirm: true },
        { label: 'Approve refund', status: 'Approved', variant: 'secondary', resolutionType: 'Refund', confirm: true },
        { label: 'Reject', status: 'Rejected', variant: 'danger', confirm: true }
      );
    }

    if (['Approved', 'Rejected'].includes(status)) {
      actions.push({ label: 'Resolve', status: 'Resolved', variant: 'primary', confirm: true });
    }

    if (this.isSuperAdmin() && ['Resolved', 'Cancelled'].includes(status)) {
      actions.push({ label: 'Reopen override', status: 'Reopened', variant: 'danger', confirm: true, requiresNote: true });
    }

    return actions;
  }

  hasAttachmentUrls(): boolean {
    return !!this.selectedDetail?.attachments?.some((attachment) => !!attachment.downloadUrl);
  }

  hasAttachments(): boolean {
    return !!this.selectedDetail?.attachments?.length;
  }

  isSuperAdmin(): boolean {
    return this.authService.currentRole === 'superadmin';
  }

  openCount(): number {
    return this.claims.filter((claim) => !['Resolved', 'Cancelled'].includes(claim.status)).length;
  }

  submittedCount(): number {
    return this.claims.filter((claim) => claim.status === 'Submitted').length;
  }

  needsInfoCount(): number {
    return this.claims.filter((claim) => claim.status === 'NeedsInfo').length;
  }

  statusTone(status: string): 'success' | 'muted' {
    return ['Approved', 'Resolved'].includes(status) ? 'success' : 'muted';
  }

  displayStatus(status: string): string {
    return status === 'UnderReview'
      ? 'Under review'
      : status === 'NeedsInfo'
        ? 'Needs info'
        : status || 'Unknown';
  }

  shortId(id: string): string {
    return ('CLM#' + (id || '').slice(-6)).toUpperCase();
  }

  ageLabel(ageHours: number): string {
    if (ageHours < 1) return '<1h';
    if (ageHours < 24) return `${Math.floor(ageHours)}h`;
    const days = Math.floor(ageHours / 24);
    return `${days}d ${Math.floor(ageHours % 24)}h`;
  }

  formatDateTime(dateStr: string): string {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return '-';
    }
  }

  formatFileSize(sizeBytes: number): string {
    if (!sizeBytes) return '-';
    if (sizeBytes < 1024 * 1024) return `${Math.ceil(sizeBytes / 1024)} KB`;
    return `${(sizeBytes / 1024 / 1024).toFixed(1)} MB`;
  }

  primaryIssueType(detail: ClaimDetail): string | null {
    return detail.items?.[0]?.issueType || null;
  }

  onFeedbackDismissed(): void {
    this.feedbackMessage = '';
  }

  private loadClaimDetail(includeAttachmentUrls: boolean): void {
    if (!this.selectedClaim) return;

    this.detailLoading = true;
    this.detailError = '';

    this.claimService.getClaim(this.selectedClaim.claimId, includeAttachmentUrls).subscribe({
      next: (detail) => {
        this.detailLoading = false;
        this.selectedDetail = detail;
      },
      error: (error) => {
        this.detailLoading = false;
        const message = error?.error?.message || error?.error?.code || 'Failed to load claim detail.';
        this.detailError = message;
        this.showFeedback(message, 'error');
      }
    });
  }

  private buildFilters(): ClaimListFilters {
    const search = this.searchTerm.trim();
    return {
      status: this.statusFilter,
      issueType: this.issueTypeFilter,
      areaId: this.isSuperAdmin() ? this.areaIdFilter : undefined,
      orderId: this.searchMode === 'orderId' ? search : undefined,
      customerPhone: this.searchMode === 'customerPhone' ? search : undefined,
      from: this.fromDate,
      to: this.toDate
    };
  }

  private parseAmount(): number | null {
    const amount = Number(this.resolutionAmount);
    return Number.isFinite(amount) && amount > 0 ? amount : null;
  }

  private showFeedback(message: string, tone: 'success' | 'error'): void {
    this.feedbackMessage = message;
    this.feedbackTone = tone;
  }
}
