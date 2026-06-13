export type ClaimStatus =
  | 'Submitted'
  | 'UnderReview'
  | 'NeedsInfo'
  | 'Approved'
  | 'Rejected'
  | 'Resolved'
  | 'Cancelled'
  | 'Reopened';

export type ClaimIssueType = 'Faulty' | 'Expired' | 'Incomplete';

export interface ClaimListFilters {
  status?: string;
  issueType?: string;
  areaId?: string;
  orderId?: string;
  customerPhone?: string;
  from?: string;
  to?: string;
}

export interface ClaimListResponse {
  totalCount: number;
  claims: ClaimAdminSummary[];
}

export interface ClaimAdminSummary {
  claimId: string;
  orderId: string;
  areaId: string;
  customerName: string;
  customerPhoneNumber: string;
  status: ClaimStatus | string;
  issueTypes: string[];
  itemCount: number;
  attachmentCount: number;
  createdAtUtc: string;
  ageHours: number;
}

export interface ClaimDetail {
  claimId: string;
  orderId: string;
  areaId: string;
  customerPhoneNumber: string;
  status: ClaimStatus | string;
  items: ClaimItem[];
  attachments: ClaimAttachmentDetail[];
  statusHistory: ClaimStatusEntry[];
  resolution?: ClaimResolution | null;
}

export interface ClaimItem {
  claimItemId?: string;
  orderItemId: string;
  productId: string;
  productName: string;
  issueType: ClaimIssueType | string;
  quantityOrdered?: number;
  quantityClaimed: number;
  description?: string | null;
}

export interface ClaimAttachmentDetail {
  attachmentId: string;
  orderItemId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  blobPath: string;
  downloadUrl?: string | null;
  downloadUrlExpiresAtUtc?: string | null;
}

export interface ClaimStatusEntry {
  status: ClaimStatus | string;
  timestampUtc: string;
  timestampPk?: string;
  changedBy: string;
  changedByRole: string;
  actorDisplayName?: string;
  note?: string | null;
  reasonCode?: string | null;
  source?: string;
}

export interface ClaimResolution {
  type: string;
  amount?: number | null;
  currency?: string;
  referenceId?: string | null;
  notes?: string | null;
}

export interface ClaimStatusUpdateRequest {
  status: string;
  note?: string | null;
  reasonCode?: string | null;
  resolution?: ClaimResolution | null;
}

export interface ClaimStatusUpdateResponse {
  claimId: string;
  status: ClaimStatus | string;
  updatedAtUtc: string;
}

export interface ClaimErrorResponse {
  code?: string;
  message?: string;
  details?: unknown;
}
