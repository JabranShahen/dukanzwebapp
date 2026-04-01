export type EventLifecycleStatus = 'draft' | 'scheduled' | 'live' | 'closed';

export interface EventRecord {
  id: string;
  PartitionKey?: string;
  partitionKey?: string;
  eventName: string;
  eventDescription?: string;
  imageURL?: string;
  lifecycleStatus: EventLifecycleStatus | string;
  startDateUtc?: string | null;
  endDateUtc?: string | null;
  order: number;
}

export interface EventMutation {
  id?: string;
  PartitionKey?: string;
  partitionKey?: string;
  eventName: string;
  eventDescription?: string;
  imageURL?: string;
  imageFile?: File | null;
  clearImage?: boolean;
  lifecycleStatus: EventLifecycleStatus | string;
  startDateUtc?: string | null;
  endDateUtc?: string | null;
  order?: number;
}

export const EDITABLE_EVENT_LIFECYCLE_STATUSES: EventLifecycleStatus[] = ['draft', 'scheduled'];
export const DISPLAYABLE_EVENT_LIFECYCLE_STATUSES: EventLifecycleStatus[] = ['draft', 'scheduled', 'live', 'closed'];
export const LAUNCHABLE_EVENT_LIFECYCLE_STATUSES: EventLifecycleStatus[] = ['draft', 'scheduled'];
export const CLOSEABLE_EVENT_LIFECYCLE_STATUSES: EventLifecycleStatus[] = ['live'];
export const REVERTABLE_TO_DRAFT_EVENT_LIFECYCLE_STATUSES: EventLifecycleStatus[] = ['live', 'closed'];
